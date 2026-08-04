package com.openfloat.middleware.controller;

import com.openfloat.middleware.entity.SystemUser;
import com.openfloat.middleware.repository.UserRepository;
import com.openfloat.middleware.security.CustomUserDetailsService;
import com.openfloat.middleware.security.JwtUtil;

import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.util.Utils;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    // TOTP helper instances
    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final QrGenerator qrGenerator = new ZxingPngQrGenerator();
    private final CodeVerifier codeVerifier = new DefaultCodeVerifier(
            new DefaultCodeGenerator(),
            new SystemTimeProvider()
    );

    // ==========================================
    // 1. LOGIN (WITH OPTIONAL 2FA CHECK)
    // ==========================================
    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthRequest authRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.username(), authRequest.password())
            );
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).body("Access Denied: Incorrect credentials.");
        }

        SystemUser user = userRepository.findByUsername(authRequest.username())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ENFORCED RULE: Check if user is an ADMIN AND has Two-Factor Authentication enabled
        if ("ADMIN".equals(user.getRole().name()) && user.isMfaEnabled()) {
            String code = authRequest.code();
            if (code == null || code.isBlank() || !codeVerifier.isValidCode(user.getMfaSecret(), code)) {
                return ResponseEntity.status(401).body(Map.of(
                        "error", "MFA_REQUIRED",
                        "message", "Two-Factor Authentication code is required or invalid."
                ));
            }
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(authRequest.username());
        final String accessToken = jwtUtil.generateToken(userDetails);
        final String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        String role = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");

        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("Strict")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(new AuthResponse(accessToken, role));
    }

    // ==========================================
    // 2. GENERATE 2FA QR CODE FOR SETUP
    // ==========================================
    @PostMapping("/mfa/setup")
    public ResponseEntity<?> setupMfa(@RequestParam String username) {
        SystemUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate a new 32-character Base32 secret
        String secret = secretGenerator.generate();

        QrData data = new QrData.Builder()
                .label(user.getUsername())
                .issuer("OpenFloat Middleware")
                .secret(secret)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();

        try {
            byte[] qrCodeImageData = qrGenerator.generate(data);
            String qrCodeDataUri = Utils.getDataUriForImage(qrCodeImageData, qrGenerator.getImageMimeType());

            return ResponseEntity.ok(Map.of(
                    "secret", secret,
                    "qrCodeDataUri", qrCodeDataUri
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error generating QR code.");
        }
    }

    // ==========================================
    // 3. VERIFY & ENABLE 2FA ON ACCOUNT
    // ==========================================
    @PostMapping("/mfa/enable")
    public ResponseEntity<?> enableMfa(@RequestBody EnableMfaRequest request) {
        SystemUser user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!codeVerifier.isValidCode(request.secret(), request.code())) {
            return ResponseEntity.badRequest().body("Invalid verification code. Setup aborted.");
        }

        user.setMfaSecret(request.secret());
        user.setMfaEnabled(true);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Two-Factor Authentication successfully enabled."));
    }

    // ==========================================
    // 4. TOKEN REFRESH
    // ==========================================
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
record AuthRequest(String username, String password, String code) {}
record EnableMfaRequest(String username, String secret, String code) {}
record AuthResponse(String token, String role) {}