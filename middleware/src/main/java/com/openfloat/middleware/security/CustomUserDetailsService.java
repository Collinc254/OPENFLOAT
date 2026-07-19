package com.openfloat.middleware.security;

import com.openfloat.middleware.model.SystemUser;
import com.openfloat.middleware.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        
        // Find the user in the database
        SystemUser systemUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        // --- STRICT SECURITY LOCKDOWN ---
        // Instantly block anyone who is not an ADMIN, even if their password is correct!
        if (!"ADMIN".equalsIgnoreCase(systemUser.getRole())) {
            throw new UsernameNotFoundException("Access Denied: You are not an Administrator.");
        }

        // Convert our SystemUser into Spring Security's built-in User object
        return User.builder()
                .username(systemUser.getUsername())
                .password(systemUser.getPassword())
                .roles(systemUser.getRole()) 
                .build();
    }
}