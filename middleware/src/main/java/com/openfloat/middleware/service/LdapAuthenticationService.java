package com.openfloat.middleware.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.query.LdapQueryBuilder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class LdapAuthenticationService {

    private final LdapTemplate ldapTemplate;
    private final AuditLogService auditLogService;

    // Injects the toggle from application.properties (defaults to LOCAL if missing)
    @Value("${openfloat.auth.strategy:LOCAL}")
    private String authStrategy;

    /**
     * Checks if the system is currently configured to use corporate Active Directory.
     */
    public boolean isLdapEnabled() {
        return "LDAP".equalsIgnoreCase(authStrategy);
    }

    /**
     * Attempts to authenticate the user against the corporate LDAP directory.
     */
    public boolean authenticate(String username, String password) {
        try {
            // Spring Security LDAP attempts to bind using the provided credentials
            ldapTemplate.authenticate(
                    LdapQueryBuilder.query().where("uid").is(username),
                    password
            );
            
            // If successful, log the event immutably
            auditLogService.logEvent(username, "LDAP_LOGIN", "ActiveDirectory", "SUCCESS");
            return true;
            
        } catch (Exception e) {
            log.warn("LDAP authentication failed for user: {}", username);
            auditLogService.logEvent(username, "LDAP_LOGIN", "ActiveDirectory", "FAILED");
            return false;
        }
    }
}