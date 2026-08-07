package com.openfloat.middleware.service;

import com.openfloat.middleware.dto.ReversalRequest;
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

    @Value("${safaricom.daraja.reversal-url}")
    private String reversalUrl;

    @Value("${safaricom.b2c.initiator-name}")
    private String initiatorName;

    @Value("${safaricom.b2c.initiator-password}")
    private String initiatorPassword;

    @Value("${safaricom.daraja.reversal-result-url}")
    private String resultUrl;

    @Value("${safaricom.daraja.reversal-timeout-url}")
    private String timeoutUrl;

    public ResponseEntity<String> initiateReversal(ReversalRequest request) {
        String accessToken = darajaAuthService.getAccessToken();
        String securityCredential;

        // Load the certificate from the resources folder and pass it to your utility
        try (InputStream certStream = new ClassPathResource("certs/SandboxCertificate.cer").getInputStream()) {
            securityCredential = securityUtility.encryptInitiatorPassword(initiatorPassword, certStream);
        } catch (Exception e) {
            log.error("Failed to load Safaricom certificate or encrypt password", e);
            throw new RuntimeException("Error securing credentials: " + e.getMessage());
        }

        Map<String, String> payload = new HashMap<>();
        payload.put("Initiator", initiatorName);
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

        try {
            log.info("Initiating Reversal for Transaction ID: {}", request.transactionId());
            return restTemplate.postForEntity(reversalUrl, entity, String.class);
        } catch (Exception e) {
            log.error("Failed to initiate reversal for {}", request.transactionId(), e);
            throw new RuntimeException("Safaricom Reversal API Error: " + e.getMessage());
        }
    }
}