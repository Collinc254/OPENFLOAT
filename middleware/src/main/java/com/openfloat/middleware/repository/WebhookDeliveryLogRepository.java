package com.openfloat.middleware.repository;

import com.openfloat.middleware.entity.WebhookDeliveryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WebhookDeliveryLogRepository extends JpaRepository<WebhookDeliveryLog, Long> {
    
    // This automatically generates a SQL query to sort by the newest attempt first
    List<WebhookDeliveryLog> findAllByOrderByAttemptedAtDesc();
}