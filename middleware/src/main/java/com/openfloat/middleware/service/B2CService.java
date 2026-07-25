package com.openfloat.middleware.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openfloat.middleware.dto.B2CRequest;
import com.openfloat.middleware.entity.B2CTransaction; 
import com.openfloat.middleware.repository.B2CTransactionRepository;
import com.openfloat.middleware.utils.B2CSecurityUtility;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class B2CService {

    private final B2CSecurityUtility securityUtility;
    private final DarajaAuthService authService;
    private final B2CTransactionRepository transactionRepository;
    private final ObjectMapper objectMapper;

    @Value("${safaricom.b2c.initiator-name}")
    private String initiatorName;

    @Value("${safaricom.b2c.initiator-password}")
    private String initiatorPassword;

    @Value("${safaricom.b2c.shortcode}")
    private String shortCode;

    @Value("${safaricom.b2c.result-url}")
    private String resultUrl;

    @Value("${safaricom.b2c.timeout-url}")
    private String timeoutUrl;

    public String sendB2CPayment(String phoneNumber, String amount, String commandId, String remarks, String occasion) {
        try {
            // 1. Load Certificate and Encrypt Password
            InputStream certStream = new ClassPathResource("certs/SandboxCertificate.cer").getInputStream();
            String encryptedCredential = securityUtility.encryptInitiatorPassword(initiatorPassword, certStream);

            // 2. Build Payload
            log.info("EXACT RESULT URL: [{}]", resultUrl);
            log.info("EXACT TIMEOUT URL: [{}]", timeoutUrl);
            
            B2CRequest requestPayload = B2CRequest.builder()
                    .InitiatorName(initiatorName)
                    .SecurityCredential(encryptedCredential)
                    .CommandID(commandId)
                    .Amount(amount)
                    .PartyA(shortCode)
                    .PartyB(phoneNumber)
                    .Remarks(remarks)
                    .QueueTimeOutURL(timeoutUrl)
                    .ResultURL(resultUrl)
                    .Occasion(occasion)
                    .build();

            // 3. Fetch Real OAuth Access Token
            String accessToken = authService.getAccessToken(); 

            // 4. Attach Token to Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            
            HttpEntity<B2CRequest> requestEntity = new HttpEntity<>(requestPayload, headers);
            RestTemplate restTemplate = new RestTemplate();
            String b2cEndpoint = "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";
            
            // 5. Send to Safaricom
            log.info("Sending B2C Request for amount {} to {}", amount, phoneNumber);
            ResponseEntity<String> response = restTemplate.postForEntity(b2cEndpoint, requestEntity, String.class);
            String responseBody = response.getBody();
            
            log.info("Safaricom B2C Acknowledgment: {}", responseBody);

            // 6. Parse JSON and Save to Database
            if (responseBody != null) {
                JsonNode jsonNode = objectMapper.readTree(responseBody);
                String responseCode = jsonNode.path("ResponseCode").asText();

                if ("0".equals(responseCode)) {
                    B2CTransaction transaction = B2CTransaction.builder()
                            .originatorConversationId(jsonNode.path("OriginatorConversationID").asText())
                            .conversationId(jsonNode.path("ConversationID").asText())
                            .phoneNumber(phoneNumber)
                            .amount(amount)
                            .status("PENDING")
                            .build();
                    
                    transactionRepository.save(transaction);
                    log.info("Successfully saved PENDING transaction to database.");
                } else {
                    log.error("Safaricom rejected the B2C request. Response: {}", responseBody);
                }
            }

            return responseBody;

        } catch (Exception e) {
            log.error("Failed to execute B2C payment: {}", e.getMessage());
            throw new RuntimeException("B2C Payment Error", e);
        }
    }
}