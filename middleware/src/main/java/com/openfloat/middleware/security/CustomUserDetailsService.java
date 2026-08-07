package com.openfloat.middleware.security;

import com.openfloat.middleware.entity.SystemUser; 
import com.openfloat.middleware.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        
        // Find the user in the database
        SystemUser systemUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        // Format base role strictly to Spring Security standards
        String roleName = systemUser.getRole().name();
        if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName;
        }

        List<GrantedAuthority> authorities = new ArrayList<>();
        
        // 1. Add the base role authority
        authorities.add(new SimpleGrantedAuthority(roleName));

        // 2. Add granular permissions as authorities
        if (systemUser.getPermissions() != null) {
            systemUser.getPermissions().forEach(permission -> 
                authorities.add(new SimpleGrantedAuthority(permission.name()))
            );
        }

        // Convert into Spring Security UserDetails with updated authorities
        return new User(
                systemUser.getUsername(),
                systemUser.getPassword(),
                systemUser.isEnabled(), // Checks if the account is active
                true,                   // account non-expired
                true,                   // credentials non-expired
                true,                   // account non-locked
                authorities
        );
    }
}