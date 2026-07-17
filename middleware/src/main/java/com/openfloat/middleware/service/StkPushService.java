package com.openfloat.middleware.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openfloat.middleware.dto.DarajaStkPushPayload;
import com.openfloat.middleware.dto.DarajaStkPushResponse;
import com.openfloat.middleware.dto.StkPushRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

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
    
    // NEW: Jackson ObjectMapper to parse Safaricom's nested JSON
    private final ObjectMapper objectMapper = new ObjectMapper();

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
            return response.getBody();
        } catch (Exception e) {
            log.error("Daraja STK Push Failed: {}", e.getMessage());
            throw new RuntimeException("Failed to initiate STK Push with Safaricom.");
        }
    }

    // NEW: Safaricom Callback Parser
    public void processCallback(String rawJson) {
        try {
            JsonNode rootNode = objectMapper.readTree(rawJson);
            JsonNode stkCallback = rootNode.path("Body").path("stkCallback");

            String checkoutRequestID = stkCallback.path("CheckoutRequestID").asText();
            int resultCode = stkCallback.path("ResultCode").asInt();
            String resultDesc = stkCallback.path("ResultDesc").asText();

            if (resultCode == 0) {
                // Payment was successful!
                JsonNode items = stkCallback.path("CallbackMetadata").path("Item");
                String mpesaReceiptNumber = "";
                
                // Safaricom sends metadata as an array of key-value pairs, so we loop to find the receipt
                for (JsonNode item : items) {
                    if ("MpesaReceiptNumber".equals(item.path("Name").asText())) {
                        mpesaReceiptNumber = item.path("Value").asText();
                        break;
                    }
                }
                
                log.info("PAYMENT SUCCESS! Receipt: {}, Checkout ID: {}", mpesaReceiptNumber, checkoutRequestID);
                
                // TODO: DATABASE UPDATE LOGIC HERE
                // 1. Use your Repository to find the transaction where CheckoutRequestID matches this one
                // 2. Update its status to "PAID"
                // 3. Save the mpesaReceiptNumber to the transaction record
                
            } else {
                // Payment failed (user cancelled, wrong PIN, insufficient funds, etc.)
                log.warn("PAYMENT FAILED! Reason: {}, Checkout ID: {}", resultDesc, checkoutRequestID);
                
                // TODO: DATABASE UPDATE LOGIC HERE
                // 1. Use your Repository to find the transaction where CheckoutRequestID matches this one
                // 2. Update its status to "FAILED"
            }

        } catch (Exception e) {
            log.error("Failed to parse Daraja callback JSON: {}", e.getMessage());
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