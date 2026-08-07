package com.openfloat.middleware.controller;

import com.openfloat.middleware.model.MpesaTransaction;
import com.openfloat.middleware.repository.TransactionRepository;
import com.openfloat.middleware.service.TransactionQueryService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions") 
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final TransactionQueryService queryService;

    // We inject both the standard repository and your new dynamic query service here
    public TransactionController(TransactionRepository transactionRepository, TransactionQueryService queryService) {
        this.transactionRepository = transactionRepository;
        this.queryService = queryService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('READ_TRANSACTIONS')")
    public ResponseEntity<List<MpesaTransaction>> getAllTransactions() {
        List<MpesaTransaction> transactions = transactionRepository.findAllByOrderByDateDesc();
        return ResponseEntity.ok(transactions);
    }

    // ==========================================
    // NEW: ADMIN DASHBOARD FILTERING ENDPOINT
    // ==========================================
    @GetMapping("/filter")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('READ_TRANSACTIONS')")
    public ResponseEntity<List<MpesaTransaction>> filterTransactions(
            @RequestParam(required = false) String clientSystemName,
            @RequestParam(required = false) Double minAmount,
            @RequestParam(required = false) Double maxAmount,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentProvider,
            @RequestParam(required = false) String accountReference,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        List<MpesaTransaction> filteredResults = queryService.getFilteredTransactions(
                clientSystemName, minAmount, maxAmount, phone, status, paymentProvider, accountReference, startDate, endDate
        );

        return ResponseEntity.ok(filteredResults);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('READ_TRANSACTIONS')")
    public ResponseEntity<MpesaTransaction> getTransactionById(@PathVariable String id) {
        return transactionRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}