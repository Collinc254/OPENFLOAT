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

        // Convert our SystemUser into Spring Security's built-in User object
        return User.builder()
                .username(systemUser.getUsername())
                .password(systemUser.getPassword())
                .roles(systemUser.getRole()) 
                .build();
    }
}