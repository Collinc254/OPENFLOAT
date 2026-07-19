package com.openfloat.middleware.repository;

import com.openfloat.middleware.model.SystemUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SystemUserRepository extends JpaRepository<SystemUser, Long> {
    // This allows the seeder to check if the admin already exists
    Optional<SystemUser> findByUsername(String username);
}