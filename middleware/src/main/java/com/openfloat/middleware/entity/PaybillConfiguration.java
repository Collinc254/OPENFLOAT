package com.openfloat.middleware.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "paybill_configurations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaybillConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String shortcode;

    @Column(name = "initiator_name", nullable = false)
    private String initiatorName;

    @Column(name = "initiator_password", nullable = false)
    private String initiatorPassword;

    @Column(name = "consumer_key", nullable = false)
    private String consumerKey;

    @Column(name = "consumer_secret", nullable = false)
    private String consumerSecret;

    // e.g., "SANDBOX" or "PRODUCTION"
    @Column(nullable = false)
    private String environment; 

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}