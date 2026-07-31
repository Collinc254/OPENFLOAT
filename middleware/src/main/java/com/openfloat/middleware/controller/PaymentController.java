package com.openfloat.middleware.controller;

import com.openfloat.middleware.dto.DarajaStkPushResponse;
import com.openfloat.middleware.dto.ResolveTransactionRequest;
import com.openfloat.middleware.dto.StkPushRequest;
import com.openfloat.middleware.model.MpesaTransaction;
import com.openfloat.middleware.service.AuditLogService;
import com.openfloat.middleware.service.StkPushService;
import com.openfloat.middleware.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
    private final AuditLogService auditLogService; // Injected AuditLogService for SIEM trails

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

    @PostMapping("/resolve")
    public ResponseEntity<?> resolveUnknownTransaction(@RequestBody ResolveTransactionRequest request) {
        log.info("Admin initiated manual resolution for transaction ID: {}", request.id());

        // 1. Find the unmatched transaction
        Optional<MpesaTransaction> optionalTx = transactionRepository.findById(request.id());
        
        if (optionalTx.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        MpesaTransaction tx = optionalTx.get();

        // 2. Prevent tampering with already matched transactions
        if ("MATCHED".equals(tx.getReconciliationStatus())) {
            return ResponseEntity.badRequest().body("Transaction is already reconciled and locked.");
        }

        // 3. Apply the manual resolution updates
        tx.setClientSystemName(request.system());
        tx.setReconciliationStatus("RESOLVED");
        
        // In a production app, fetch the logged-in admin's username from SecurityContextHolder
        String currentUser = "Collins / ADMIN"; 
        
        tx.setReconciledBy(currentUser);
        tx.setReconciliationNotes(request.note());
        tx.setResolvedAt(LocalDateTime.now());

        transactionRepository.save(tx);

        // 4. Write to the Immutable Audit Trail
        auditLogService.logEvent(
            currentUser, 
            "MANUAL_RECONCILIATION", 
            "MpesaTransaction ID: " + tx.getId() + " -> Assigned to: " + request.system(), 
            "SUCCESS"
        );

        return ResponseEntity.ok(Map.of(
            "message", "Transaction successfully resolved.",
            "receipt", tx.getMpesaRef()
        ));
    }
}