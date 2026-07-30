package com.openfloat.middleware.controller;

import com.openfloat.middleware.entity.PaymentReference;
import com.openfloat.middleware.service.ReferenceGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/references")
@RequiredArgsConstructor
public class ReferenceController {

    private final ReferenceGenerationService referenceService;

    @PostMapping("/generate")
    public ResponseEntity<?> generateReference(
            @RequestHeader("X-API-KEY") String apiKey,
            @RequestParam(defaultValue = "24") int validityHours) {
        
        try {
            PaymentReference reference = referenceService.generateReferenceForClient(apiKey, validityHours);
            
            return ResponseEntity.ok(Map.of(
                    "message", "Reference generated successfully",
                    "referenceCode", reference.getReferenceCode(),
                    "expiresAt", reference.getExpiresAt(),
                    "status", reference.getStatus()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}