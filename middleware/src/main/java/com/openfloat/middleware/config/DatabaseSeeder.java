package com.openfloat.middleware.config;

import com.openfloat.middleware.model.SystemUser;
import com.openfloat.middleware.repository.UserRepository;
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

    // CHANGED: Now using your existing UserRepository
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_USERNAME:}")
    private String adminUsername;

    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
        
        if (adminUsername == null || adminUsername.trim().isEmpty() || 
            adminPassword == null || adminPassword.trim().isEmpty()) {
            log.warn("CRITICAL: Admin environment variables are empty. Skipping database seeding.");
            return;
        }

        // Check if the admin user exists using your specific repository
        if (userRepository.findByUsername(adminUsername.trim()).isEmpty()) {
            SystemUser admin = new SystemUser();
            admin.setUsername(adminUsername.trim());
            admin.setPassword(passwordEncoder.encode(adminPassword.trim()));
            admin.setRole("ADMIN");

            userRepository.save(admin);
            log.info("SUCCESS: Default Admin user created securely!");
        } else {
            log.info("Admin user already exists. Skipping setup.");
        }
    }
}