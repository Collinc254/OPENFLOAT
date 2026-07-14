package com.openfloat.middleware.repository;

import com.openfloat.middleware.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface TenantRepository extends JpaRepository<Tenant, String> {
    
    // Spring automatically writes the SQL query for this based on the method name
    // It translates to: SELECT * FROM tenants WHERE tenant_id = ? AND is_active = true
    Optional<Tenant> findByTenantIdAndIsActiveTrue(String tenantId);
}