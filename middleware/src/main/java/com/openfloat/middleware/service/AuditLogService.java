package com.openfloat.middleware.service;

import com.openfloat.middleware.model.AuditLog;
import com.openfloat.middleware.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void logEvent(String actor, String action, String targetComponent, String status) {
        AuditLog auditEntry = new AuditLog(actor, action, targetComponent, status);
        auditLogRepository.save(auditEntry);
        log.info("SIEM AUDIT: [{}] {} performed {} on {} - Status: {}", 
            auditEntry.getEventId(), actor, action, targetComponent, status);
    }
}