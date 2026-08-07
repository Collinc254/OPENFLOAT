package com.openfloat.middleware.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // In-memory cache to store a token bucket for each unique IP address
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    private Bucket createNewBucket() {
        // Defines the rate limit: 100 requests per minute, per IP address.
        Bandwidth limit = Bandwidth.builder()
                .capacity(100)
                .refillGreedy(100, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, 
            HttpServletResponse response, 
            FilterChain filterChain
    ) throws ServletException, IOException {
        
        // Identify the client by their IP address, accounting for reverse proxies/load balancers
        String forwardedFor = request.getHeader("X-Forwarded-For");
        String ip = (forwardedFor != null && !forwardedFor.isEmpty()) ? forwardedFor.split(",")[0].trim() : request.getRemoteAddr();
        
        // Fetch their existing bucket, or create a new one if it's their first request
        Bucket bucket = cache.computeIfAbsent(ip, k -> createNewBucket());

        // Try to consume 1 token for this request
        if (bucket.tryConsume(1)) {
            // Token available: let the request pass through to the next filter
            filterChain.doFilter(request, response);
        } else {
            // Bucket empty: Reject the request immediately with a 429 status
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Too many requests. Please try again in a minute.\"}");
        }
    }
}