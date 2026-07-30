package com.openfloat.middleware.controller;

import com.openfloat.middleware.model.RegisterRequest;
import com.openfloat.middleware.entity.SystemUser;
import com.openfloat.middleware.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')") // STRICT SECURITY: Only Admins can execute this
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        
        // 1. Prevent duplicate usernames
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username is already taken!"));
        }

        // 2. Build the user and secure the password
        SystemUser newUser = new SystemUser();
        newUser.setUsername(request.getUsername());
        
        // 💥 BCrypt securely hashes the plain text password from React before saving
        newUser.setPassword(passwordEncoder.encode(request.getPassword())); 
        
        newUser.setRole(request.getRole());

        // 3. Save to PostgreSQL
        userRepository.save(newUser);

        return ResponseEntity.ok(Map.of("message", "User created successfully!"));
    }
}