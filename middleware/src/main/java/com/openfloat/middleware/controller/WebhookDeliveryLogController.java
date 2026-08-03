package com.openfloat.middleware.controller;

import com.openfloat.middleware.entity.WebhookDeliveryLog;
import com.openfloat.middleware.repository.WebhookDeliveryLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*")
public class WebhookDeliveryLogController {

    private final WebhookDeliveryLogRepository repository;
    private final RestTemplate restTemplate = new RestTemplate();

    // 1. Fetch all logs for the React Dashboard
    @GetMapping("/logs")
    public ResponseEntity<List<WebhookDeliveryLog>> getAllLogs() {
        return ResponseEntity.ok(repository.findAllByOrderByAttemptedAtDesc());
    }

    // 2. Resend a specific webhook payload
    @PostMapping("/{id}/resend")
    public ResponseEntity<?> resendWebhook(@PathVariable Long id) {
        WebhookDeliveryLog logEntry = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Webhook log not found"));

        // Increment retries and set the retry timestamp
        logEntry.setRetryCount(logEntry.getRetryCount() + 1);
        logEntry.setLastRetryTime(LocalDateTime.now());

        long startTime = System.currentTimeMillis();
        try {
            // Prepare the HTTP request with the exact payload saved in the database
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(logEntry.getPayloadSent(), headers);

            // Fire the request to the client's URL
            ResponseEntity<String> response = restTemplate.postForEntity(
                    logEntry.getTargetUrl(), 
                    request, 
                    String.class
            );
            
            // Update the log with the new response
            logEntry.setHttpResponseCode(response.getStatusCode().value());
            logEntry.setResponseMessage(response.getBody());
            logEntry.setSuccessful(response.getStatusCode().is2xxSuccessful());

        } catch (Exception e) {
            log.error("Manual webhook resend failed: {}", e.getMessage());
            logEntry.setHttpResponseCode(500);
            logEntry.setResponseMessage(e.getMessage());
            logEntry.setSuccessful(false);
        } finally {
            // Calculate response time and save the updated entity
            logEntry.setResponseTimeMs(System.currentTimeMillis() - startTime);
            repository.save(logEntry);
        }

        return ResponseEntity.ok(Map.of(
            "message", "Webhook resend executed",
            "status", logEntry.isSuccessful() ? "SUCCESS" : "FAILED"
        ));
    }
}