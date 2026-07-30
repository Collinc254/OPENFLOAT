package com.openfloat.middleware.controller;

import com.openfloat.middleware.dto.DarajaStkPushResponse;
import com.openfloat.middleware.dto.StkPushRequest;
import com.openfloat.middleware.model.MpesaTransaction;
import com.openfloat.middleware.service.StkPushService;
import com.openfloat.middleware.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@Slf4j
// THE FIX: Using originPatterns instead of origins to support credentialed requests (Authorization headers)
@CrossOrigin(originPatterns = "*", allowCredentials = "true") 
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final StkPushService stkPushService;
    private final TransactionRepository transactionRepository;

    @GetMapping
    public ResponseEntity<?> getAllTransactions() {
        log.info("Frontend requested live database transactions.");
        return ResponseEntity.ok(transactionRepository.findAll());
    }

    @PostMapping(value = {"/trigger", "/stk-push"})
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

    @GetMapping("/status/{checkoutRequestId}")
    public ResponseEntity<?> getTransactionStatus(@PathVariable String checkoutRequestId) {
        Optional<MpesaTransaction> transaction = transactionRepository.findByCheckoutRequestId(checkoutRequestId);

        if (transaction.isPresent()) {
            MpesaTransaction trx = transaction.get();
            return ResponseEntity.ok(Map.of(
                    "status", trx.getStatus(),
                    "receiptNumber", trx.getMpesaRef() != null ? trx.getMpesaRef() : ""
            ));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}