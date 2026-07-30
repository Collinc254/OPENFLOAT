package com.openfloat.middleware.controller;

import com.openfloat.middleware.security.CustomUserDetailsService;
import com.openfloat.middleware.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor 
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthRequest authRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.username(), authRequest.password())
            );
        } catch (AuthenticationException e) {
            // Updated error message since any valid user (Admin, Manager, Staff) can now log in
            return ResponseEntity.status(401).body("Access Denied: Incorrect credentials.");
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(authRequest.username());
        final String jwt = jwtUtil.generateToken(userDetails);
        
        // Extract the user's actual role and strip the "ROLE_" prefix added by Spring Security
        String role = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");

        // Return BOTH the token and the dynamic role to React
        return ResponseEntity.ok(new AuthResponse(jwt, role));
    }
}

// Data Transfer Objects
record AuthRequest(String username, String password) {}

// UPDATED: Now requires a role to be sent to the frontend
record AuthResponse(String token, String role) {}