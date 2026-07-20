package com.openfloat.middleware.repository;

import com.openfloat.middleware.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Optional<Tenant> findByTenantIdAndIsActiveTrue(String tenantId);
    Optional<Tenant> findByApiKeyAndIsActiveTrue(String apiKey);
}