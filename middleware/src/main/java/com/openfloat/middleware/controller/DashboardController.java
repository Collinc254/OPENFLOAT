package com.openfloat.middleware.controller;

import com.openfloat.middleware.model.MpesaTransaction;
import com.openfloat.middleware.repository.ClientSystemRepository;
import com.openfloat.middleware.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final TransactionRepository transactionRepository;
    private final ClientSystemRepository clientRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('OPERATOR', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        List<MpesaTransaction> allTx = transactionRepository.findAll();
        
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime startOfMonth = LocalDateTime.of(LocalDate.now().withDayOfMonth(1), LocalTime.MIN);

        // 1. Time-based Payment Counts
        long paymentsToday = allTx.stream()
                .filter(tx -> tx.getDate() != null && tx.getDate().isAfter(startOfDay))
                .count();
                
        long paymentsThisMonth = allTx.stream()
                .filter(tx -> tx.getDate() != null && tx.getDate().isAfter(startOfMonth))
                .count();

        // 2. Financials (FIXED: Now includes "PAID")
        BigDecimal totalTransactionValue = allTx.stream()
                .filter(tx -> {
                    String s = tx.getStatus();
                    return "SUCCESS".equals(s) || "COMPLETED".equals(s) || "PAID".equals(s);
                })
                .filter(tx -> tx.getAmount() != null)
                .map(MpesaTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Callback & System Health (FIXED: Now includes "PAID")
        long totalProcessed = allTx.size();
        long successfulCallbacks = allTx.stream().filter(tx -> {
            String s = tx.getStatus();
            return "SUCCESS".equals(s) || "COMPLETED".equals(s) || "PAID".equals(s);
        }).count();
        long failedCallbacks = allTx.stream().filter(tx -> "FAILED".equals(tx.getStatus())).count();
        
        double successPercentage = totalProcessed > 0 ? ((double) successfulCallbacks / totalProcessed) * 100 : 0.0;

        // 4. Exceptions & Recon (FIXED: Safely catches nulls as unmatched/pending)
        long unknownReferences = allTx.stream()
                .filter(tx -> tx.getReconciliationStatus() == null || "UNMATCHED".equals(tx.getReconciliationStatus()))
                .count();
                
        long pendingReconciliations = unknownReferences;

        // 5. API Gateway Metrics
        long registeredClients = clientRepository.count();
        long activeApiKeys = clientRepository.findAll().stream().filter(c -> c.isEnabled()).count();

        // 6. Live Activity (Latest 10 transactions for the feed)
        List<MpesaTransaction> liveActivity = allTx.stream()
                .filter(tx -> tx.getDate() != null)
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .limit(10)
                .collect(Collectors.toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("paymentsToday", paymentsToday);
        stats.put("paymentsThisMonth", paymentsThisMonth);
        stats.put("totalTransactionValue", totalTransactionValue);
        stats.put("registeredClients", registeredClients);
        stats.put("activeApiKeys", activeApiKeys);
        stats.put("callbackSuccessPercentage", String.format("%.1f", successPercentage));
        stats.put("failedCallbacks", failedCallbacks);
        stats.put("unknownReferences", unknownReferences);
        stats.put("pendingReconciliations", pendingReconciliations);
        stats.put("liveActivity", liveActivity);
        stats.put("activeUsers", 1); 

        return ResponseEntity.ok(stats);
    }
}