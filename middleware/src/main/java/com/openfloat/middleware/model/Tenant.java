package com.openfloat.middleware.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "registered_tenants")
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // <--- This resolves the setName() error in MiddlewareApplication

    @Column(nullable = false, unique = true)
    private String tenantId;

    @Column(nullable = false, unique = true)
    private String apiKey;

    @Column(nullable = false)
    private String callbackUrl;

    private boolean isActive = true;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}