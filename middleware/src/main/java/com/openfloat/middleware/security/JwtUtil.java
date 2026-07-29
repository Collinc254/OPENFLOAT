package com.openfloat.middleware.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {

    // 1. FIXED STATIC KEY: This is over 256-bits long and will NEVER change.
    private static final String SECRET_KEY_STRING = "OpenFloatEnterpriseSecureSecretKey2026!@#$%^&*()";

    // Tokens will expire after 10 hours
    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 10;

    // 2. HELPER METHOD: Converts the static string into a signing key
    private Key getSignInKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY_STRING.getBytes());
    }

    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSignInKey()) // Uses the permanent static key
                .compact();
    }

    public String extractUsername(String token) {
        // Warning fixed: Swapped method reference for standard lambda
        return extractClaim(token, claims -> claims.getSubject());
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        // Warning fixed: Swapped method reference for standard lambda
        return extractClaim(token, claims -> claims.getExpiration());
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSignInKey()) // Uses the permanent static key
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claimsResolver.apply(claims);
    }
}