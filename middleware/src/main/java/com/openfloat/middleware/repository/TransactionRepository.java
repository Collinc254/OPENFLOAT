package com.openfloat.middleware.repository;

import com.openfloat.middleware.model.MpesaTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<MpesaTransaction, String> {
    
    // Automatically generates a SQL query to fetch all records sorted by date
    List<MpesaTransaction> findAllByOrderByDateDesc();

    // NEW: Find a transaction using Safaricom's Checkout Request ID
    Optional<MpesaTransaction> findByCheckoutRequestId(String checkoutRequestId);
}