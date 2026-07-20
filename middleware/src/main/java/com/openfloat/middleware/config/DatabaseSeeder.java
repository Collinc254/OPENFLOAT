package com.openfloat.middleware.config;

import com.openfloat.middleware.model.SystemUser;
import com.openfloat.middleware.model.Tenant;
import com.openfloat.middleware.repository.UserRepository;
import com.openfloat.middleware.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_USERNAME:}")
    private String adminUsername;

    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
        
        // 1. Seed the Admin User
        if (adminUsername == null || adminUsername.trim().isEmpty() || 
            adminPassword == null || adminPassword.trim().isEmpty()) {
            log.warn("CRITICAL: Admin environment variables are empty. Skipping admin database seeding.");
        } else {
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

        // 2. Seed the Default Gateway Tenant
        if (tenantRepository.count() == 0) {
            Tenant defaultTenant = new Tenant();
            defaultTenant.setName("OpenFloat External Application");
            defaultTenant.setTenantId("TENANT-001");
            defaultTenant.setApiKey(UUID.randomUUID().toString()); // Generates a secure API key
            defaultTenant.setCallbackUrl("https://openfloat.onrender.com/api/v1/callbacks/stk-push");
            
            tenantRepository.save(defaultTenant);
            log.info("SUCCESS: Default test tenant created securely with an API key!");
        } else {
            log.info("Gateway tenant already exists. Skipping setup.");
        }
    }
}