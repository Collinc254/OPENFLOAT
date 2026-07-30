package com.openfloat.middleware.security;

import com.openfloat.middleware.entity.SystemUser; 
import com.openfloat.middleware.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        
        // Find the user in the database
        SystemUser systemUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        // Since role is now an Enum, we use .name() to get its String value
        String roleName = systemUser.getRole().name();
        
        // Format the database string strictly to Spring Security standards
        if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName;
        }

        // Convert our SystemUser into Spring Security's built-in User object with explicit Authority and Enabled status
        return new User(
                systemUser.getUsername(),
                systemUser.getPassword(),
                systemUser.isEnabled(), // NEW: Spring Security now checks if the account is active
                true,                   // account non-expired
                true,                   // credentials non-expired
                true,                   // account non-locked
                Collections.singletonList(new SimpleGrantedAuthority(roleName))
        );
    }
}