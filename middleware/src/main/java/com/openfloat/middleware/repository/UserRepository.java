package com.openfloat.middleware.repository;

import com.openfloat.middleware.model.SystemUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<SystemUser, Long> {
    
    // Spring Data JPA automatically writes the SQL query for this
    Optional<SystemUser> findByUsername(String username);
    
}