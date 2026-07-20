package com.openfloat.middleware.repository;

import com.openfloat.middleware.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    // Automatically retrieves logs sorted by the newest events first
    List<AuditLog> findAllByOrderByTimestampDesc();
}