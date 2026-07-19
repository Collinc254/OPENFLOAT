package com.openfloat.middleware.controller;

import com.openfloat.middleware.dto.DarajaStkPushResponse;
import com.openfloat.middleware.dto.StkPushRequest;
import com.openfloat.middleware.repository.TransactionRepository;
import com.openfloat.middleware.service.StkPushService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class StkPushController {

    private final StkPushService stkPushService;
    private final TransactionRepository transactionRepository;

    @PostMapping("/stk-push")
    public ResponseEntity<DarajaStkPushResponse> initiateStkPush(@Valid @RequestBody StkPushRequest request) {
        DarajaStkPushResponse response = stkPushService.sendPush(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/callback")
    public ResponseEntity<String> handleDarajaCallback(@RequestBody String callbackPayload) {
        log.info("DARAJA CALLBACK RECEIVED: {}", callbackPayload);
        stkPushService.processCallback(callbackPayload);
        return ResponseEntity.ok("Callback received successfully");
    }

    @GetMapping("/status/{checkoutRequestId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable String checkoutRequestId) {
        return transactionRepository.findByCheckoutRequestId(checkoutRequestId)
                .map(txn -> {
                    Map<String, String> response = new HashMap<>();
                    String currentStatus = txn.getStatus();
                    
                    if ("SUCCESS".equalsIgnoreCase(currentStatus) || "0".equals(currentStatus)) {
                        response.put("status", "SUCCESS");
                        response.put("receiptNumber", txn.getMpesaRef()); 
                    } else if (currentStatus != null && !currentStatus.equalsIgnoreCase("PENDING")) {
                        response.put("status", "FAILED");
                    } else {
                        response.put("status", "PENDING");
                    }
                    
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.ok(Map.of("status", "PENDING"))); 
    }
}