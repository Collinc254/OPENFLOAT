package com.openfloat.middleware.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final StringRedisTemplate redisTemplate;
    private static final String IDEMPOTENCY_PREFIX = "IDEMPOTENCY_LOCK:";
    
    // We lock the transaction ID for 24 hours to prevent duplicate processing
    private static final Duration LOCK_EXPIRATION = Duration.ofHours(24);

    /**
     * Attempts to acquire a lock for the given M-Pesa Transaction ID.
     * @return true if this is a duplicate request, false if it is a new request.
     */
    public boolean isDuplicate(String transactionId) {
        if (transactionId == null || transactionId.isBlank()) {
            return false; 
        }

        String key = IDEMPOTENCY_PREFIX + transactionId;
        
        // setIfAbsent returns true if the key was created (meaning it is a new request)
        // It returns false if the key already exists (meaning it is a duplicate callback)
        Boolean isNewRequest = redisTemplate.opsForValue().setIfAbsent(key, "LOCKED", LOCK_EXPIRATION);
        
        if (Boolean.FALSE.equals(isNewRequest)) {
            log.warn("IDEMPOTENCY GUARD: Blocked duplicate Safaricom callback for Transaction ID: {}", transactionId);
            return true;
        }
        
        return false;
    }
}