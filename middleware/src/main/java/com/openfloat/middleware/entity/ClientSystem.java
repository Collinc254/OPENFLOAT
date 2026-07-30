package com.openfloat.middleware.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "client_systems")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientSystem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String systemName;

    // Public identifier for the external system
    @Column(nullable = false, unique = true, updatable = false)
    private String apiKey; 

    // Hashed secret for authentication
    @Column(nullable = false)
    private String clientSecret; 

    // Where OpenFloat will forward the Safaricom results
    @Column(nullable = false)
    private String webhookUrl; 

    @Column(nullable = false)
    private boolean enabled = true;

    // Default rate limit (e.g., requests per minute)
    @Column(nullable = false)
    private Integer rateLimitPerMinute = 60; 

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Utility method to automatically generate a unique API Key before saving
    @PrePersist
    protected void onCreate() {
        if (this.apiKey == null) {
            this.apiKey = "pk_live_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        }
    }
}