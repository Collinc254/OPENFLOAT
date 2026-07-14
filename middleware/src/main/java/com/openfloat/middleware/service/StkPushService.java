package com.openfloat.middleware.service;

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