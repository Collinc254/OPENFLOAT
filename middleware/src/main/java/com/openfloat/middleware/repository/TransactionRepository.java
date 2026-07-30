package com.openfloat.middleware.repository;

import com.openfloat.middleware.model.MpesaTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<MpesaTransaction, String>, JpaSpecificationExecutor<MpesaTransaction> {
    
    // Automatically generates a SQL query to fetch all records sorted by date
    List<MpesaTransaction> findAllByOrderByDateDesc();

    // Find a transaction using Safaricom's Checkout Request ID
    Optional<MpesaTransaction> findByCheckoutRequestId(String checkoutRequestId);
}