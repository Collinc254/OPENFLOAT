package com.openfloat.middleware.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class C2BRegistrationService {

    private final DarajaAuthService darajaAuthService;

    @Value("${safaricom.daraja.c2b-register-url}")
    private String registerUrl;

    @Value("${safaricom.daraja.shortcode}")
    private String shortcode;

    public void registerUrls() {
        // FIX: Pass the shortcode to fetch the dynamic token for this specific paybill
        String accessToken = darajaAuthService.getAccessToken(shortcode);

        Map<String, String> payload = new HashMap<>();
        payload.put("ShortCode", shortcode);
        payload.put("ResponseType", "Completed"); 
        payload.put("ConfirmationURL", "https://openfloat.onrender.com/api/v1/c2b/confirmation");
        payload.put("ValidationURL", "https://openfloat.onrender.com/api/v1/c2b/validation");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(payload, headers);
        RestTemplate restTemplate = new RestTemplate();

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(registerUrl, entity, String.class);
            log.info("C2B URLs Registered Successfully: {}", response.getBody());
        } catch (Exception e) {
            log.error("Failed to register C2B URLs", e);
        }
    }
}