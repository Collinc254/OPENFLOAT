package com.openfloat.middleware.entity;

import com.openfloat.middleware.security.AttributeEncryptor;
import jakarta.persistence.*;
import lombok.*;
import java.util.HashSet;
import java.util.Set;

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

    // ENCRYPTION ADDED: Protects the 2FA seed from database breaches
    @Column
    @Convert(converter = AttributeEncryptor.class)
    private String mfaSecret; 

    // ==========================================
    // GRANULAR PERMISSIONS
    // ==========================================
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_permissions", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "permission")
    @Builder.Default
    private Set<Permission> permissions = new HashSet<>();

    // Custom getter safely handles legacy database rows that have 'null'
    // This keeps AuthController.java perfectly happy!
    public boolean isMfaEnabled() {
        return mfaEnabled != null && mfaEnabled;
    }
}