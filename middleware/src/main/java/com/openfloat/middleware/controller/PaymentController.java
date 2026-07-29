package com.openfloat.middleware.controller;

import com.openfloat.middleware.dto.DarajaStkPushResponse;
import com.openfloat.middleware.dto.StkPushRequest;
import com.openfloat.middleware.service.StkPushService;

// 1. THIS IS THE NEW IMPORT FOR YOUR DATABASE REPOSITORY
import com.openfloat.middleware.repository.TransactionRepository; 

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final StkPushService stkPushService;
    
    // 2. WE INJECT THE REPOSITORY HERE TO ACCESS PostgreSQL
    private final TransactionRepository transactionRepository;
    
    @GetMapping
    public ResponseEntity<?> getAllTransactions() {
        log.info("Frontend requested live database transactions.");
        
        // 3. THIS NOW FETCHES ALL REAL RECORDS INSTEAD OF SENDING "[]"
        return ResponseEntity.ok(transactionRepository.findAll());
    }
    
    @PostMapping("/trigger")
    public ResponseEntity<DarajaStkPushResponse> triggerStkPush(@RequestBody StkPushRequest request) {
        DarajaStkPushResponse response = stkPushService.sendPush(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/callback")
    public ResponseEntity<String> handleCallback(@RequestBody String rawJson) {
        log.info("Controller received incoming payload at /api/v1/payments/callback");
        stkPushService.processCallback(rawJson);
        return ResponseEntity.ok("{\"ResultCode\": 0, \"ResultDesc\": \"Accepted\"}");
    }
}