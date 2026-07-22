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

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final TransactionRepository transactionRepository;
    private final RabbitTemplate rabbitTemplate;

    public DarajaStkPushResponse sendPush(StkPushRequest request) {
        String token = getAccessToken();
        String timestamp = generateTimestamp();
        String password = generatePassword(timestamp);

        DarajaStkPushPayload payload = new DarajaStkPushPayload(
                shortcode,
                password,
                timestamp,
                "CustomerPayBillOnline",
                String.valueOf(request.amount().intValue()),
                request.msisdn(),
                shortcode,
                request.msisdn(),
                callbackUrl,
                request.invoiceRef(),
                "Payment for Invoice " + request.invoiceRef()
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        HttpEntity<DarajaStkPushPayload> entity = new HttpEntity<>(payload, headers);

        log.info("Initiating STK Push to MSISDN: {} for Amount: {}", request.msisdn(), request.amount());

        try {
            ResponseEntity<DarajaStkPushResponse> response = restTemplate.postForEntity(
                    stkPushUrl, entity, DarajaStkPushResponse.class);
            
            DarajaStkPushResponse pushResponse = response.getBody();

            if (pushResponse != null) {
                MpesaTransaction pendingTrx = new MpesaTransaction();
                pendingTrx.setId(request.invoiceRef());
                pendingTrx.setPhone(request.msisdn());
                pendingTrx.setAmount(request.amount());
                pendingTrx.setType("STK Push");
                pendingTrx.setStatus("PENDING");
                pendingTrx.setMpesaRef("PENDING");
                pendingTrx.setDate(LocalDateTime.now());
                pendingTrx.setCheckoutRequestId(pushResponse.checkoutRequestId()); 
                
                transactionRepository.save(pendingTrx);
            }

            return pushResponse;
        } catch (Exception e) {
            log.error("Daraja STK Push Failed: {}", e.getMessage());
            throw new RuntimeException("Failed to initiate STK Push with Safaricom.");
        }
    }

    public void processCallback(String rawJson) {
        try {
            log.info("RAW DARAJA CALLBACK: {}", rawJson);

            JsonNode rootNode = objectMapper.readTree(rawJson);
            JsonNode bodyNode = rootNode.has("Body") ? rootNode.path("Body") : rootNode.path("body");
            JsonNode stkCallback = bodyNode.path("stkCallback");

            String checkoutRequestID = stkCallback.path("CheckoutRequestID").asText();
            int resultCode = stkCallback.path("ResultCode").asInt();
            String resultDesc = stkCallback.path("ResultDesc").asText();

            Optional<MpesaTransaction> optionalTrx = transactionRepository.findByCheckoutRequestId(checkoutRequestID);

            if (optionalTrx.isPresent()) {
                MpesaTransaction trx = optionalTrx.get();

                if (resultCode == 0) {
                    JsonNode items = stkCallback.path("CallbackMetadata").path("Item");
                    String mpesaReceiptNumber = "";
                    String transactionDateStr = "";
                    String phoneNumber = "";
                    
                    if (items.isArray()) {
                        for (JsonNode item : items) {
                            String name = item.path("Name").asText();
                            if ("MpesaReceiptNumber".equals(name)) {
                                mpesaReceiptNumber = item.path("Value").asText();
                            } else if ("TransactionDate".equals(name)) {
                                transactionDateStr = item.path("Value").asText();
                            } else if ("PhoneNumber".equals(name)) {
                                phoneNumber = item.path("Value").asText();
                            }
                        }
                    }
                    
                    log.info("PAYMENT SUCCESS! Database updated. Receipt: {}, Checkout ID: {}", mpesaReceiptNumber, checkoutRequestID);
                    
                    trx.setStatus("PAID");
                    trx.setMpesaRef(mpesaReceiptNumber);

                    if (!phoneNumber.isEmpty()) {
                        trx.setPhone(phoneNumber);
                    }

                    if (!transactionDateStr.isEmpty()) {
                        try {
                            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
                            LocalDateTime parsedDate = LocalDateTime.parse(transactionDateStr, formatter);
                            trx.setDate(parsedDate);
                        } catch (Exception e) {
                            log.warn("Could not parse transaction date '{}': {}", transactionDateStr, e.getMessage());
                        }
                    }
                    
                    rabbitTemplate.convertAndSend("openfloat.erp.queue", trx);
                    log.info("Message successfully published to CloudAMQP queue!");
                    
                } else {
                    log.warn("PAYMENT FAILED! Database updated. Reason: {}, Checkout ID: {}", resultDesc, checkoutRequestID);
                    trx.setStatus("FAILED");
                }

                transactionRepository.save(trx);

            } else {
                log.error("CRITICAL ERROR: Received callback for Checkout ID {} but it was not found in the database!", checkoutRequestID);
            }

        } catch (Exception e) {
            log.error("Failed to parse Daraja callback JSON or update database: {}", e.getMessage());
        }
    }

    private record DarajaAuthResponse(String access_token) {}

    private String getAccessToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(consumerKey, consumerSecret); 
        
        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
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