package com.openfloat.middleware.service;

import com.openfloat.middleware.entity.ClientSystem;
import com.openfloat.middleware.entity.PaymentReference;
import com.openfloat.middleware.repository.ClientSystemRepository;
import com.openfloat.middleware.repository.PaymentReferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReferenceGenerationService {

    private final PaymentReferenceRepository referenceRepository;
    private final ClientSystemRepository clientSystemRepository;

    @Transactional
    public PaymentReference generateReferenceForClient(String apiKey, int validityHours) {
        // 1. Authenticate and retrieve the client system
        ClientSystem client = clientSystemRepository.findByApiKey(apiKey)
                .orElseThrow(() -> new RuntimeException("Invalid API Key: Client system not found"));

        if (!client.isEnabled()) {
            throw new RuntimeException("Access Denied: Client system is currently suspended");
        }

        // 2. Create the reference entity
        PaymentReference reference = new PaymentReference();
        reference.setClientSystem(client);
        
        // 3. Set the expiry time based on the requested validity
        reference.setExpiresAt(LocalDateTime.now().plusHours(validityHours));

        // 4. Save to the database (The @PrePersist handles the unique code generation)
        // Spring Data JPA and PostgreSQL unique constraints ensure duplicates are strictly prevented
        return referenceRepository.save(reference);
    }
    
    public boolean isReferenceValid(String referenceCode) {
        PaymentReference reference = referenceRepository.findByReferenceCode(referenceCode)
                .orElseThrow(() -> new RuntimeException("Reference not found"));
                
        // Check if it has expired or has already been used
        if (reference.getExpiresAt().isBefore(LocalDateTime.now()) || !reference.getStatus().equals("PENDING")) {
            return false;
        }
        
        return true;
    }
}
