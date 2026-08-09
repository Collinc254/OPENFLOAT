package com.openfloat.middleware.service;

import com.openfloat.middleware.model.AuditLog;
import com.openfloat.middleware.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    // REQUIRES_NEW guarantees the audit log saves to the DB even if the main transaction fails
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(String actor, String action, String targetComponent, String status) {
        
        // 1. Fetch the hash of the preceding log entry
        AuditLog lastLog = auditLogRepository.findTopByOrderByIdDesc().orElse(null);
        String previousHash = (lastLog != null) ? lastLog.getCurrentHash() : 
            "GENESIS_BLOCK_000000000000000000000000000000000000000000000000";

        // 2. Prepare the raw data string for hashing (including previous hash)
        String rawData = actor + action + targetComponent + status + previousHash;

        // 3. Generate the SHA-256 hash for this specific event
        String currentHash = generateSha256(rawData);

        // 4. Build and save the immutable log entry
        AuditLog newLog = new AuditLog(actor, action, targetComponent, status, previousHash, currentHash);
        auditLogRepository.save(newLog);
        
        // 5. Output structured JSON to the console for Logstash/Splunk ingestion
        log.info("SIEM_AUDIT_TRAIL: {\"eventId\":\"{}\", \"actor\":\"{}\", \"action\":\"{}\", \"status\":\"{}\", \"hash\":\"{}\"}", 
                 newLog.getEventId(), actor, action, status, currentHash);
    }

    private String generateSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedHash.length);
            for (byte b : encodedHash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.error("CRITICAL: Failed to generate SHA-256 hash for audit log", e);
            return "HASH_GENERATION_FAILED";
        }
    }
}