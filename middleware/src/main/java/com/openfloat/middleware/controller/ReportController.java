package com.openfloat.middleware.controller;

import com.openfloat.middleware.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayInputStream;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // 1. Endpoint for Excel Download
    @GetMapping("/transactions/excel")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('VIEW_FINANCE_REPORTS')")
    public ResponseEntity<InputStreamResource> downloadTransactionExcel() {
        ByteArrayInputStream stream = reportService.generateTransactionExcel();
        
        HttpHeaders headers = new HttpHeaders();
        // This header forces the browser to download the file rather than trying to open it in a tab
        headers.add("Content-Disposition", "attachment; filename=transactions_report.xlsx");
        
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(stream));
    }

    // 2. Endpoint for PDF Download
    @GetMapping("/transactions/pdf")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('VIEW_FINANCE_REPORTS')")
    public ResponseEntity<InputStreamResource> downloadTransactionPdf() {
        ByteArrayInputStream stream = reportService.generateTransactionPdf();
        
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=transactions_report.pdf");
        
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(stream));
    }
}