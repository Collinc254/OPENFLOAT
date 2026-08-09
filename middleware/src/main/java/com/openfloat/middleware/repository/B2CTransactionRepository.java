package com.openfloat.middleware.repository;

import com.openfloat.middleware.entity.B2CTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface B2CTransactionRepository extends JpaRepository<B2CTransaction, Long> {
    
    // Required for the Checker to fetch all drafted payments
    List<B2CTransaction> findByStatus(String status);
    
    // Crucial for looking up the transaction when the Safaricom callback arrives
    Optional<B2CTransaction> findByOriginatorConversationId(String originatorConversationId);
    
}