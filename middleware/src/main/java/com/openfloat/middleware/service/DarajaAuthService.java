package com.openfloat.middleware.service;

import com.openfloat.middleware.dto.OAuthResponse;
import com.openfloat.middleware.entity.PaybillConfiguration;
import com.openfloat.middleware.repository.PaybillConfigurationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class DarajaAuthService {

    private final PaybillConfigurationRepository paybillRepository;

    public String getAccessToken(String shortcode) {
        try {
            // 1. Fetch dynamic credentials for the provided shortcode
            PaybillConfiguration paybill = paybillRepository.findByShortcodeAndIsActiveTrue(shortcode)
                    .orElseThrow(() -> new RuntimeException("Active configuration not found for shortcode: " + shortcode));

            String credentials = paybill.getConsumerKey() + ":" + paybill.getConsumerSecret();
            String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());

            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(encodedCredentials); 
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> request = new HttpEntity<>(headers);
            RestTemplate restTemplate = new RestTemplate();

            // 2. Determine the correct endpoint based on environment
            String oauthEndpoint = "PRODUCTION".equalsIgnoreCase(paybill.getEnvironment())
                    ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
                    : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

            log.info("Requesting new Daraja OAuth token for shortcode: {}", shortcode);
            ResponseEntity<OAuthResponse> response = restTemplate.exchange(
                    oauthEndpoint,
                    HttpMethod.GET,
                    request,
                    OAuthResponse.class
            );

            log.info("OAuth token successfully generated for shortcode: {}", shortcode);
            return response.getBody().getAccessToken();

        } catch (Exception e) {
            log.error("Failed to generate Daraja access token: {}", e.getMessage());
            throw new RuntimeException("Authentication Error", e);
        }
    }
}