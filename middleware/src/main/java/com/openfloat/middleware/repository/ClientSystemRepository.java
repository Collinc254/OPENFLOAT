package com.openfloat.middleware.repository;

import com.openfloat.middleware.entity.ClientSystem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientSystemRepository extends JpaRepository<ClientSystem, Long> {
    boolean existsBySystemName(String systemName);
    Optional<ClientSystem> findByApiKey(String apiKey);
}