package com.openfloat.middleware.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openfloat.middleware.dto.B2CRequest;
import com.openfloat.middleware.entity.B2CTransaction;
import com.openfloat.middleware.entity.PaybillConfiguration; // WE WILL CREATE THIS NEXT
import com.openfloat.middleware.repository.B2CTransactionRepository;
import com.openfloat.middleware.repository.PaybillConfigurationRepository; // WE WILL CREATE THIS NEXT
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
    
    // NEW: Injecting the database configuration repository
    private final PaybillConfigurationRepository paybillRepository; 
    private final ObjectMapper objectMapper;

    // Callback URLs stay static because they point to your middleware, not Safaricom
    @Value("${safaricom.b2c.result-url}")
    private String resultUrl;

    @Value("${safaricom.b2c.timeout-url}")
    private String timeoutUrl;

    // UPDATED: Now accepts the draft transaction object and the target shortcode
    public String sendB2CPayment(B2CTransaction transaction, String commandId, String remarks, String occasion, String targetShortCode) {
        try {
            // 1. Fetch Dynamic Paybill Credentials from Database
            PaybillConfiguration paybill = paybillRepository.findByShortcodeAndIsActiveTrue(targetShortCode)
                    .orElseThrow(() -> new RuntimeException("Active configuration not found for shortcode: " + targetShortCode));

            // 2. Load the correct Certificate dynamically (Sandbox vs Production)
            String certName = "PRODUCTION".equalsIgnoreCase(paybill.getEnvironment()) ? "ProductionCertificate.cer" : "SandboxCertificate.cer";
            InputStream certStream = new ClassPathResource("certs/" + certName).getInputStream();
            
            // 3. Encrypt dynamic password
            String encryptedCredential = securityUtility.encryptInitiatorPassword(paybill.getInitiatorPassword(), certStream);

            // 4. Build Payload using DB credentials
            log.info("EXACT RESULT URL: [{}]", resultUrl);
            log.info("EXACT TIMEOUT URL: [{}]", timeoutUrl);
            
            B2CRequest requestPayload = B2CRequest.builder()
                    .InitiatorName(paybill.getInitiatorName())
                    .SecurityCredential(encryptedCredential)
                    .CommandID(commandId)
                    .Amount(transaction.getAmount())
                    .PartyA(paybill.getShortcode())
                    .PartyB(transaction.getPhoneNumber())
                    .Remarks(remarks)
                    .QueueTimeOutURL(timeoutUrl)
                    .ResultURL(resultUrl)
                    .Occasion(occasion)
                    .build();

            // 5. Fetch Real OAuth Access Token dynamically for this specific shortcode
            String accessToken = authService.getAccessToken(paybill.getShortcode()); 

            // 6. Attach Token to Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            
            HttpEntity<B2CRequest> requestEntity = new HttpEntity<>(requestPayload, headers);
            RestTemplate restTemplate = new RestTemplate();
            
            // Set endpoint dynamically based on environment
            String b2cEndpoint = "PRODUCTION".equalsIgnoreCase(paybill.getEnvironment()) 
                    ? "https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest"
                    : "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";
            
            // 7. Send to Safaricom
            log.info("Sending B2C Request for amount {} to {} using Shortcode {}", transaction.getAmount(), transaction.getPhoneNumber(), paybill.getShortcode());
            ResponseEntity<String> response = restTemplate.postForEntity(b2cEndpoint, requestEntity, String.class);
            String responseBody = response.getBody();
            
            log.info("Safaricom B2C Acknowledgment: {}", responseBody);

            // 8. Parse JSON and Update the EXISTING Database Record
            if (responseBody != null) {
                JsonNode jsonNode = objectMapper.readTree(responseBody);
                String responseCode = jsonNode.path("ResponseCode").asText();

                if ("0".equals(responseCode)) {
                    // UPDATE the existing draft instead of creating a duplicate
                    transaction.setOriginatorConversationId(jsonNode.path("OriginatorConversationID").asText());
                    transaction.setConversationId(jsonNode.path("ConversationID").asText());
                    transaction.setStatus("APPROVED_SENT");
                    
                    transactionRepository.save(transaction);
                    log.info("Successfully updated transaction {} with Safaricom Conversation IDs.", transaction.getId());
                } else {
                    log.error("Safaricom rejected the B2C request. Response: {}", responseBody);
                    transaction.setStatus("FAILED_AT_SAFARICOM");
                    transactionRepository.save(transaction);
                }
            }

            return responseBody;

        } catch (Exception e) {
            log.error("Failed to execute B2C payment: {}", e.getMessage());
            throw new RuntimeException("B2C Payment Error", e);
        }
    }
}