package com.openfloat.middleware.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openfloat.middleware.dto.DarajaStkPushPayload;
import com.openfloat.middleware.dto.DarajaStkPushResponse;
import com.openfloat.middleware.dto.StkPushRequest;
import com.openfloat.middleware.model.MpesaTransaction;
import com.openfloat.middleware.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StkPushService {

    @Value("${safaricom.daraja.consumer-key}")
    private String consumerKey;

    @Value("${safaricom.daraja.consumer-secret}")
    private String consumerSecret;

    @Value("${safaricom.daraja.shortcode}")
    private String shortcode;

    @Value("${safaricom.daraja.passkey}")
    private String passkey;

    @Value("${safaricom.daraja.auth-url}")
    private String authUrl;

    @Value("${safaricom.daraja.stk-push-url}")
    private String stkPushUrl;

    @Value("${safaricom.daraja.callback-url}")
    private String callbackUrl;

    // RestTemplate is Spring's default HTTP client for making external API calls
    private final RestTemplate restTemplate = new RestTemplate();
    
    // Jackson ObjectMapper to parse Safaricom's nested JSON
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Inject the database repository
    private final TransactionRepository transactionRepository;

    // NEW: Inject RabbitTemplate to talk to CloudAMQP
    private final RabbitTemplate rabbitTemplate;

    public DarajaStkPushResponse sendPush(StkPushRequest request) {
        // 1. Get the temporary security token
        String token = getAccessToken();
        
        // 2. Generate the timestamp and encrypted password
        String timestamp = generateTimestamp();
        String password = generatePassword(timestamp);

        // 3. Build the exact payload Safaricom expects
        DarajaStkPushPayload payload = new DarajaStkPushPayload(
                shortcode,
                password,
                timestamp,
                "CustomerPayBillOnline",
                String.valueOf(request.amount().intValue()), // Safaricom expects whole numbers as strings
                request.msisdn(),
                shortcode,
                request.msisdn(),
                callbackUrl,
                request.invoiceRef(),
                "Payment for Invoice " + request.invoiceRef()
        );

        // 4. Attach the headers and Bearer token
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        HttpEntity<DarajaStkPushPayload> entity = new HttpEntity<>(payload, headers);

        log.info("Initiating STK Push to MSISDN: {} for Amount: {}", request.msisdn(), request.amount());

        // 5. Fire the POST request to Daraja
        try {
            ResponseEntity<DarajaStkPushResponse> response = restTemplate.postForEntity(
                    stkPushUrl, entity, DarajaStkPushResponse.class);
            
            DarajaStkPushResponse pushResponse = response.getBody();

            // Save the initial PENDING transaction to the database
            if (pushResponse != null) {
                MpesaTransaction pendingTrx = new MpesaTransaction();
                pendingTrx.setId(request.invoiceRef()); // e.g., INV-123456789
                pendingTrx.setPhone(request.msisdn());
                pendingTrx.setAmount(request.amount());
                pendingTrx.setType("STK Push");
                pendingTrx.setStatus("PENDING");
                pendingTrx.setDate(LocalDateTime.now());
                
                // IMPORTANT: If your DarajaStkPushResponse uses a different getter name (like getCheckoutRequestID()), update it here.
                pendingTrx.setCheckoutRequestId(pushResponse.checkoutRequestId()); 
                
                transactionRepository.save(pendingTrx);
            }

            return pushResponse;
        } catch (Exception e) {
            log.error("Daraja STK Push Failed: {}", e.getMessage());
            throw new RuntimeException("Failed to initiate STK Push with Safaricom.");
        }
    }

    // Safaricom Callback Parser and Database Updater
    public void processCallback(String rawJson) {
        try {
            JsonNode rootNode = objectMapper.readTree(rawJson);
            JsonNode stkCallback = rootNode.path("Body").path("stkCallback");

            String checkoutRequestID = stkCallback.path("CheckoutRequestID").asText();
            int resultCode = stkCallback.path("ResultCode").asInt();
            String resultDesc = stkCallback.path("ResultDesc").asText();

            // Look up the transaction in the database using the Checkout Request ID
            Optional<MpesaTransaction> optionalTrx = transactionRepository.findByCheckoutRequestId(checkoutRequestID);

            if (optionalTrx.isPresent()) {
                MpesaTransaction trx = optionalTrx.get();

                if (resultCode == 0) {
                    // Payment was successful! Extract the receipt number.
                    JsonNode items = stkCallback.path("CallbackMetadata").path("Item");
                    String mpesaReceiptNumber = "";
                    
                    for (JsonNode item : items) {
                        if ("MpesaReceiptNumber".equals(item.path("Name").asText())) {
                            mpesaReceiptNumber = item.path("Value").asText();
                            break;
                        }
                    }
                    
                    log.info("PAYMENT SUCCESS! Database updated. Receipt: {}, Checkout ID: {}", mpesaReceiptNumber, checkoutRequestID);
                    
                    // Update database entity to PAID
                    trx.setStatus("PAID");
                    trx.setMpesaRef(mpesaReceiptNumber);
                    
                    // NEW: Push the successful transaction to your RabbitMQ queue
                    rabbitTemplate.convertAndSend("openfloat.erp.queue", trx);
                    log.info("Message successfully published to CloudAMQP queue!");
                    
                } else {
                    // Payment failed
                    log.warn("PAYMENT FAILED! Database updated. Reason: {}, Checkout ID: {}", resultDesc, checkoutRequestID);
                    
                    // Update database entity to FAILED
                    trx.setStatus("FAILED");
                }

                // Commit the status change to the database
                transactionRepository.save(trx);

            } else {
                log.error("CRITICAL ERROR: Received callback for Checkout ID {} but it was not found in the database!", checkoutRequestID);
            }

        } catch (Exception e) {
            log.error("Failed to parse Daraja callback JSON or update database: {}", e.getMessage());
        }
    }

    // --- Helper Methods for Cryptography and Auth ---

    // A strictly-typed record to handle the Safaricom authentication response cleanly
    private record DarajaAuthResponse(String access_token) {}

    private String getAccessToken() {
        HttpHeaders headers = new HttpHeaders();
        // Spring handles encoding the basic auth credentials for us
        headers.setBasicAuth(consumerKey, consumerSecret); 
        
        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
            // Using our clean record instead of a generic Map
            ResponseEntity<DarajaAuthResponse> response = restTemplate.exchange(
                    authUrl, HttpMethod.GET, request, DarajaAuthResponse.class);
            
            if (response.getBody() != null && response.getBody().access_token() != null) {
                return response.getBody().access_token();
            } else {
                throw new RuntimeException("Access token missing in Daraja response");
            }
        } catch (Exception e) {
            log.error("Failed to authenticate with Daraja: {}", e.getMessage());
            throw new RuntimeException("Daraja Authentication Failed");
        }
    }

    private String generateTimestamp() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }

    private String generatePassword(String timestamp) {
        String rawData = shortcode + passkey + timestamp;
        return Base64.getEncoder().encodeToString(rawData.getBytes(StandardCharsets.UTF_8));
    }
}