package com.openfloat.middleware.controller;

import com.openfloat.middleware.model.MpesaTransaction;
import com.openfloat.middleware.repository.TransactionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions") 
public class TransactionController {

    // 1. Mark the field as final
    private final TransactionRepository transactionRepository;

    // 2. Create a constructor for injection (Spring automatically wires this up)
    public TransactionController(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    // Endpoint to get all transactions for the Finance Dashboard
    @GetMapping
    public ResponseEntity<List<MpesaTransaction>> getAllTransactions() {
        List<MpesaTransaction> transactions = transactionRepository.findAllByOrderByDateDesc();
        return ResponseEntity.ok(transactions);
    }

    // Endpoint to get a single transaction by ID for the Operator Dashboard polling
    @GetMapping("/{id}")
    public ResponseEntity<MpesaTransaction> getTransactionById(@PathVariable String id) {
        return transactionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}