package com.openfloat.middleware.controller;

import com.openfloat.middleware.dto.AuditReportResponse;
import com.openfloat.middleware.service.ReconciliationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/reconciliation")
@RequiredArgsConstructor
public class ReconciliationController {

    private final ReconciliationService reconciliationService;

    @PostMapping("/audit")
    public ResponseEntity<AuditReportResponse> runAudit(@RequestParam("providerFile") MultipartFile providerFile) {
        AuditReportResponse report = reconciliationService.processProviderStatement(providerFile);
        return ResponseEntity.ok(report);
    }
}