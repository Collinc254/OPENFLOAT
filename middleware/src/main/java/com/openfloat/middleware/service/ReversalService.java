package com.openfloat.middleware.service;

import com.openfloat.middleware.dto.ReversalRequest;
import com.openfloat.middleware.entity.PaybillConfiguration;
import com.openfloat.middleware.repository.PaybillConfigurationRepository;
import com.openfloat.middleware.utils.B2CSecurityUtility;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReversalService {

    private final DarajaAuthService darajaAuthService;
    private final B2CSecurityUtility securityUtility;
    
    //  Injecting the database configuration repository
    private final PaybillConfigurationRepository paybillRepository;

    @Value("${safaricom.daraja.reversal-result-url}")
    private String resultUrl;

    @Value("${safaricom.daraja.reversal-timeout-url}")
    private String timeoutUrl;

    // UPDATED: Now requires the targetShortCode to know which paybill credentials to use
    public ResponseEntity<String> initiateReversal(ReversalRequest request, String targetShortCode) {
        
        // 1. Fetch dynamic credentials for the specific paybill
        PaybillConfiguration paybill = paybillRepository.findByShortcodeAndIsActiveTrue(targetShortCode)
                .orElseThrow(() -> new RuntimeException("Active configuration not found for shortcode: " + targetShortCode));

        // 2. Fetch Token with shortcode
        String accessToken = darajaAuthService.getAccessToken(targetShortCode);
        String securityCredential;

        // 3. Load the correct certificate dynamically (Sandbox vs Production)
        String certName = "PRODUCTION".equalsIgnoreCase(paybill.getEnvironment()) ? "ProductionCertificate.cer" : "SandboxCertificate.cer";
        try (InputStream certStream = new ClassPathResource("certs/" + certName).getInputStream()) {
            securityCredential = securityUtility.encryptInitiatorPassword(paybill.getInitiatorPassword(), certStream);
        } catch (Exception e) {
            log.error("Failed to load Safaricom certificate or encrypt password", e);
            throw new RuntimeException("Error securing credentials: " + e.getMessage());
        }

        // 4. Build Payload
        Map<String, String> payload = new HashMap<>();
        payload.put("Initiator", paybill.getInitiatorName());
        payload.put("SecurityCredential", securityCredential);
        payload.put("CommandID", "TransactionReversal");
        payload.put("TransactionID", request.transactionId());
        payload.put("Amount", request.amount());
        payload.put("ReceiverParty", request.receiverParty());
        payload.put("RecieverIdentifierType", "11"); // 11 for Organization (Paybill/Till)
        payload.put("ResultURL", resultUrl);
        payload.put("QueueTimeOutURL", timeoutUrl);
        payload.put("Remarks", request.remarks());
        payload.put("Occasion", request.occasion());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(payload, headers);
        RestTemplate restTemplate = new RestTemplate();

        // 5. Determine endpoint dynamically based on environment
        String reversalUrl = "PRODUCTION".equalsIgnoreCase(paybill.getEnvironment())
                ? "https://api.safaricom.co.ke/mpesa/reversal/v1/request"
                : "https://sandbox.safaricom.co.ke/mpesa/reversal/v1/request";

        try {
            log.info("Initiating Reversal for Transaction ID: {} using shortcode {}", request.transactionId(), targetShortCode);
            return restTemplate.postForEntity(reversalUrl, entity, String.class);
        } catch (Exception e) {
            log.error("Failed to initiate reversal for {}", request.transactionId(), e);
            throw new RuntimeException("Safaricom Reversal API Error: " + e.getMessage());
        }
    }
}