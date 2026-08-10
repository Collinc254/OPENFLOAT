package com.openfloat.middleware.controller;

import com.openfloat.middleware.entity.PaybillConfiguration;
import com.openfloat.middleware.repository.PaybillConfigurationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/paybills")
@RequiredArgsConstructor
public class PaybillController {

    private final PaybillConfigurationRepository paybillRepository;

    // Fetch all configurations
    @GetMapping
    public ResponseEntity<List<PaybillConfiguration>> getAllPaybills() {
        return ResponseEntity.ok(paybillRepository.findAll());
    }

    // Save a new configuration
    @PostMapping
    public ResponseEntity<PaybillConfiguration> addPaybill(@RequestBody PaybillConfiguration config) {
        // Ensure only one configuration can be active at a time if this one is set to active
        if (config.isActive()) {
            paybillRepository.findAll().forEach(existing -> {
                existing.setActive(false);
                paybillRepository.save(existing);
            });
        }
        PaybillConfiguration savedConfig = paybillRepository.save(config);
        return ResponseEntity.ok(savedConfig);
    }

    // Toggle active status
    @PutMapping("/{id}/toggle")
    public ResponseEntity<?> togglePaybillStatus(@PathVariable Long id) {
        return paybillRepository.findById(id).map(config -> {
            boolean isCurrentlyActive = config.isActive();
            
            // If we are turning this ONE on, turn all others OFF first
            if (!isCurrentlyActive) {
                paybillRepository.findAll().forEach(existing -> {
                    existing.setActive(false);
                    paybillRepository.save(existing);
                });
            }
            
            config.setActive(!isCurrentlyActive);
            paybillRepository.save(config);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}