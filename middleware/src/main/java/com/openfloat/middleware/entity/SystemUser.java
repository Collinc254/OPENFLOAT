package com.openfloat.middleware.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "system_users") 
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    // Using the Enum instead of a String is much safer for enterprise RBAC
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; 

    // Controls whether the user is active or disabled. Default is true.
    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true; 

    // ==========================================
    // TWO-FACTOR AUTHENTICATION (TOTP)
    // ==========================================
    
    // FIXED: Added columnDefinition to prevent PostgreSQL null constraint errors
    @Column(nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean mfaEnabled = false;

    @Column
    private String mfaSecret; // Stores the secure key for Google Authenticator
}