package com.openfloat.middleware.service;

import com.openfloat.middleware.dto.OAuthResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class DarajaAuthService {

    @Value("${safaricom.consumer-key}")
    private String consumerKey;

    @Value("${safaricom.consumer-secret}")
    private String consumerSecret;

    @Value("${safaricom.oauth-endpoint:https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials}")
    private String oauthEndpoint;

    public String getAccessToken() {
        try {
            String credentials = consumerKey + ":" + consumerSecret;
            String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());

            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(encodedCredentials); 
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> request = new HttpEntity<>(headers);
            RestTemplate restTemplate = new RestTemplate();

            log.info("Requesting new Daraja OAuth token...");
            ResponseEntity<OAuthResponse> response = restTemplate.exchange(
                    oauthEndpoint,
                    HttpMethod.GET,
                    request,
                    OAuthResponse.class
            );

            log.info("OAuth token successfully generated.");
            return response.getBody().getAccessToken();

        } catch (Exception e) {
            log.error("Failed to generate Daraja access token: {}", e.getMessage());
            throw new RuntimeException("Authentication Error", e);
        }
    }
}