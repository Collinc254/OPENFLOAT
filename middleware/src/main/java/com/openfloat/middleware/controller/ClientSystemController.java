package com.openfloat.middleware.controller;

import com.openfloat.middleware.entity.ClientSystem;
import com.openfloat.middleware.model.RegisterClientRequest;
import com.openfloat.middleware.repository.ClientSystemRepository;
// ADDED IMPORT
import com.openfloat.middleware.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/clients")
@RequiredArgsConstructor
public class ClientSystemController {

    private final ClientSystemRepository clientRepository;
    private final PasswordEncoder passwordEncoder;
    
    // ADDED NOTIFICATION SERVICE INJECTION
    private final NotificationService notificationService;

    // 1. Register a new Client System
    @PostMapping("/register")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<?> registerClient(@RequestBody RegisterClientRequest request) {
        
        if (clientRepository.existsBySystemName(request.getSystemName())) {
            return ResponseEntity.badRequest().body(Map.of("error", "System name is already registered!"));
        }

        // Generate a secure, random Client Secret
        String rawSecret = "sec_live_" + UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().substring(0, 8);

        ClientSystem newClient = new ClientSystem();
        newClient.setSystemName(request.getSystemName());
        newClient.setWebhookUrl(request.getWebhookUrl());
        
        if (request.getRateLimitPerMinute() != null) {
            newClient.setRateLimitPerMinute(request.getRateLimitPerMinute());
        }

        // Hash the secret before saving to the database
        newClient.setClientSecret(passwordEncoder.encode(rawSecret));

        clientRepository.save(newClient);

        // ADDED NOTIFICATION TRIGGER FOR NEW CLIENT REGISTRATION
        notificationService.createAlert(
            "NEW_CLIENT", 
            "A new API client was registered: " + request.getSystemName()
        );

        // Return the RAW secret to the frontend so the Manager can copy it.
        // It will never be visible again after this.
        return ResponseEntity.ok(Map.of(
                "message", "Client system registered successfully.",
                "systemName", newClient.getSystemName(),
                "apiKey", newClient.getApiKey(),
                "clientSecret", rawSecret
        ));
    }

    // 2. Fetch all registered systems (hiding secrets)
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<?> getAllClients() {
        var clients = clientRepository.findAll().stream().map(client -> Map.of(
                "id", client.getId(),
                "systemName", client.getSystemName(),
                "apiKey", client.getApiKey(),
                "webhookUrl", client.getWebhookUrl(),
                "rateLimit", client.getRateLimitPerMinute(),
                "enabled", client.isEnabled()
        )).toList();
        
        return ResponseEntity.ok(clients);
    }

    // 3. Toggle Client System Access
    @PutMapping("/{id}/toggle-status")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<?> toggleClientStatus(@PathVariable Long id) {
        ClientSystem client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client system not found"));

        client.setEnabled(!client.isEnabled());
        clientRepository.save(client);

        String status = client.isEnabled() ? "Activated" : "Suspended";
        return ResponseEntity.ok(Map.of("message", "Client system successfully " + status));
    }
}