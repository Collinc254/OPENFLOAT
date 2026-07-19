package com.openfloat.middleware.config;

import com.openfloat.middleware.model.SystemUser;
import com.openfloat.middleware.repository.SystemUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final SystemUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Pulls the username from Render environment variables
    @Value("${ADMIN_USERNAME}")
    private String adminUsername;

    // Pulls the password from Render environment variables
    @Value("${ADMIN_PASSWORD}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
        
        // Check if this username is already in the database
        if (userRepository.findByUsername(adminUsername).isEmpty()) {
            
            SystemUser admin = new SystemUser();
            admin.setUsername(adminUsername);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole("ADMIN");

            userRepository.save(admin);
            log.info("SUCCESS: Default Admin user created!");
        } else {
            log.info("Admin user already exists. Skipping setup.");
        }
    }
}