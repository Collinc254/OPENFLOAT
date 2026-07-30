package com.openfloat.middleware.repository;

import com.openfloat.middleware.entity.PaymentReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentReferenceRepository extends JpaRepository<PaymentReference, Long> {
    
    // Finds a reference by its unique code
    Optional<PaymentReference> findByReferenceCode(String referenceCode);
    
    // Checks if a code exists to absolutely guarantee no duplicates
    boolean existsByReferenceCode(String referenceCode);
}
