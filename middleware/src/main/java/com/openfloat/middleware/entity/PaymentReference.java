package com.openfloat.middleware.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_references")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Requirement 1 & 4: Unique and non-duplicable
    @Column(nullable = false, unique = true, updatable = false)
    private String referenceCode;

    // Requirement 2: Associate with the requesting client system
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_system_id", nullable = false)
    private ClientSystem clientSystem;

    // Tracks the lifecycle of the reference
    @Column(nullable = false)
    private String status = "PENDING"; // States: PENDING, COMPLETED, EXPIRED

    // Requirement 3: Allow account reference expiry
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.referenceCode == null) {
            // Generates a short, unique 8-character alphanumeric code
            this.referenceCode = "REF-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        }
    }
}