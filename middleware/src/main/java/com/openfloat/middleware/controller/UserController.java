package com.openfloat.middleware.controller;

import com.openfloat.middleware.entity.Permission;
import com.openfloat.middleware.entity.Role;
import com.openfloat.middleware.entity.SystemUser;
import com.openfloat.middleware.model.RegisterRequest;
import com.openfloat.middleware.model.UpdatePermissionsRequest;
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username is already taken!"));
        }

        SystemUser newUser = new SystemUser();
        newUser.setUsername(request.getUsername());
        newUser.setPassword(passwordEncoder.encode(request.getPassword())); 
        newUser.setRole(request.getRole());
        newUser.setMfaEnabled(false);

        userRepository.save(newUser);

        return ResponseEntity.ok(Map.of("message", "User created successfully!"));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        var users = userRepository.findAll().stream().map(user -> Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "role", user.getRole().name(),
                "enabled", user.isEnabled(),
                "mfaEnabled", user.isMfaEnabled(),
                "permissions", user.getPermissions() // Exposes permissions to React
        )).toList();
        
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        SystemUser user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.getRole() == Role.ADMIN) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot disable an Admin account."));
        }

        user.setEnabled(!user.isEnabled());
        userRepository.save(user);

        String status = user.isEnabled() ? "Activated" : "Deactivated";
        return ResponseEntity.ok(Map.of("message", "User account successfully " + status));
    }

    // NEW ENDPOINT: Update granular permissions for Managers or Staff
    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserPermissions(
            @PathVariable Long id, 
            @RequestBody UpdatePermissionsRequest request) {
            
        SystemUser user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.ADMIN) {
            return ResponseEntity.badRequest().body(Map.of("error", "Admin permissions cannot be modified."));
        }

        user.setPermissions(request.getPermissions());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User permissions updated successfully!"));
    }
}