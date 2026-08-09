package com.openfloat.middleware.repository;

import com.openfloat.middleware.entity.PaybillConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaybillConfigurationRepository extends JpaRepository<PaybillConfiguration, Long> {
    
    // Finds the paybill by its shortcode, but only if it is marked as active
    Optional<PaybillConfiguration> findByShortcodeAndIsActiveTrue(String shortcode);
    
}