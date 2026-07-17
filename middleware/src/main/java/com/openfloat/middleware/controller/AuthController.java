package com.openfloat.middleware.controller;

import com.openfloat.middleware.model.SystemUser;
import com.openfloat.middleware.repository.UserRepository;
import com.openfloat.middleware.security.CustomUserDetailsService;
import com.openfloat.middleware.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // --- NEW REGISTRATION ENDPOINT ---
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody AuthRequest request) {
        // 1. Check if the username is already taken
        if (userRepository.findByUsername(request.username()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Username is already taken!");
        }

        // 2. Create a new user entity
        SystemUser newUser = new SystemUser();
        newUser.setUsername(request.username());
        
        // 3. Hash the password before saving it to the database
        newUser.setPassword(passwordEncoder.encode(request.password()));
        
        // 4. Assign a default role
        newUser.setRole("USER");

        // 5. Save to the database
        userRepository.save(newUser);

        return ResponseEntity.ok("User registered successfully!");
    }

    // --- EXISTING LOGIN ENDPOINT ---
    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthRequest authRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.username(), authRequest.password())
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body("Incorrect username or password");
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(authRequest.username());
        final String jwt = jwtUtil.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(jwt));
    }
}

// Data Transfer Objects
record AuthRequest(String username, String password) {}
record AuthResponse(String token) {}