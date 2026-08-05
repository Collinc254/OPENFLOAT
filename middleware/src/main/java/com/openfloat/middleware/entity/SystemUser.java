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
    
    // FIX: Added @Builder.Default and = false to prevent Lombok from sending nulls during registration
    @Column(name = "mfa_enabled")
    @Builder.Default
    private Boolean mfaEnabled = false;

    @Column
    private String mfaSecret; 

    // Custom getter safely handles legacy database rows that have 'null'
    // This keeps AuthController.java perfectly happy!
    public boolean isMfaEnabled() {
        return mfaEnabled != null && mfaEnabled;
    }
}