package com.openfloat.middleware.controller;

import com.openfloat.middleware.security.CustomUserDetailsService;
import com.openfloat.middleware.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
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
            return ResponseEntity.status(401).body("Access Denied: Incorrect credentials.");
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(authRequest.username());
        
        final String accessToken = jwtUtil.generateToken(userDetails);
        final String refreshToken = jwtUtil.generateRefreshToken(userDetails); 
        
        String role = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");

        // Build the highly secure HttpOnly cookie
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(true) // Ensures cookie is only sent over HTTPS
                .path("/") // Makes cookie available to all API endpoints
                .maxAge(7 * 24 * 60 * 60) // 7 days in seconds
                .sameSite("Strict") // Prevents CSRF attacks
                .build();

        // Return the Access Token and Role in the body, but put the Refresh Token in the Header
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(new AuthResponse(accessToken, role));
    }

    // UPDATED: Now automatically extracts the refreshToken from the cookies
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh token cookie is missing");
        }

        try {
            String username = jwtUtil.extractUsername(refreshToken);
            if (username != null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                
                if (jwtUtil.isTokenValid(refreshToken, userDetails)) {
                    
                    String newAccessToken = jwtUtil.generateToken(userDetails);
                    String role = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
                    
                    // We only need to return the new access token
                    return ResponseEntity.ok(new AuthResponse(newAccessToken, role));
                }
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired refresh token.");
        }
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid refresh token.");
    }
}

// Data Transfer Objects
record AuthRequest(String username, String password) {}

// We no longer need the RefreshRequest record because the cookie handles it!

// Removed refreshToken from the response body since it lives in the cookie now
record AuthResponse(String token, String role) {}