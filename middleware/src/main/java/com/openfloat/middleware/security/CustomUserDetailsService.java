package com.openfloat.middleware.security;

import com.openfloat.middleware.model.SystemUser;
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

        // SECURE FIX: Format the database string strictly to Spring Security standards
        String roleName = systemUser.getRole();
        if (roleName != null && !roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName.toUpperCase();
        }

        // Convert our SystemUser into Spring Security's built-in User object with explicit Authority
        return new User(
                systemUser.getUsername(),
                systemUser.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(roleName))
        );
    }
}