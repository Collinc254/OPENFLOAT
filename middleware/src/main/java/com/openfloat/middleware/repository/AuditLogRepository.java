package com.openfloat.middleware.repository;

import com.openfloat.middleware.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Fetches the latest audit log entry to retrieve the previous SHA-256 hash
     * and maintain the tamper-evident cryptographic chain.
     */
    Optional<AuditLog> findTopByOrderByIdDesc();

    /**
     * Fetches all audit logs ordered by their timestamp in descending order.
     * This resolves the compilation error in AuditLogController.
     */
    List<AuditLog> findAllByOrderByTimestampDesc();
}