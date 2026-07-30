package com.openfloat.middleware.repository;

import com.openfloat.middleware.entity.SystemUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<SystemUser, Long> {
    
    // Spring Data JPA automatically writes the SQL query for this
    Optional<SystemUser> findByUsername(String username);
    
    // The Admin Console needs this to prevent creating duplicate usernames
    boolean existsByUsername(String username);
    
}