package com.openfloat.middleware.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.openfloat.middleware.entity.WebhookDeliveryLog;
import com.openfloat.middleware.model.WebhookPayload;
import com.openfloat.middleware.repository.WebhookDeliveryLogRepository;
// ADDED IMPORT
import com.openfloat.middleware.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookDeliveryService {

    private final WebhookDeliveryLogRepository logRepository;
    private final ObjectMapper objectMapper;
    
    // ADDED NOTIFICATION SERVICE INJECTION
    private final NotificationService notificationService;
    
    // Spring's built-in HTTP client for making external requests
    private final RestTemplate restTemplate = new RestTemplate();

    @RabbitListener(queues = "${openfloat.rabbitmq.queue}")
    public void processWebhookDelivery(WebhookPayload payload) {
        log.info("Attempting to deliver webhook for reference: {}", payload.getReferenceCode());

        WebhookDeliveryLog deliveryLog = new WebhookDeliveryLog();
        deliveryLog.setReferenceCode(payload.getReferenceCode());
        deliveryLog.setClientSystemName(payload.getClientSystemName());
        deliveryLog.setTargetUrl(payload.getTargetUrl());

        // Start timing the HTTP request
        long startTime = System.currentTimeMillis();

        try {
            // 1. Prepare the JSON body
            String jsonPayload = objectMapper.writeValueAsString(payload.getPaymentData());
            deliveryLog.setPayloadSent(jsonPayload);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(jsonPayload, headers);

            // 2. Fire the webhook to the external client
            ResponseEntity<String> response = restTemplate.postForEntity(
                    payload.getTargetUrl(),
                    request,
                    String.class
            );

            // 3. Record the exact response and calculate response time
            deliveryLog.setHttpResponseCode(response.getStatusCode().value());
            deliveryLog.setResponseMessage(response.getBody());
            deliveryLog.setSuccessful(response.getStatusCode().is2xxSuccessful());
            deliveryLog.setResponseTimeMs(System.currentTimeMillis() - startTime);

            logRepository.save(deliveryLog);

            // 4. Trigger Retry if the client's server failed
            if (!deliveryLog.isSuccessful()) {
                log.warn("Webhook delivered but client returned error status: {}", response.getStatusCode());
                throw new RuntimeException("Client rejected webhook. Forcing RabbitMQ retry.");
            }

        } catch (Exception e) {
            // If their server is completely down/timed out, log the error, record time, and force a retry
            deliveryLog.setSuccessful(false);
            deliveryLog.setResponseMessage(e.getMessage());
            deliveryLog.setResponseTimeMs(System.currentTimeMillis() - startTime);
            logRepository.save(deliveryLog);
            
            log.error("Webhook delivery failed. Throwing exception to trigger RabbitMQ retry.");
            
            // ADDED NOTIFICATION TRIGGER FOR FAILED CALLBACK
            notificationService.createAlert(
                "FAILED_CALLBACK", 
                "Webhook delivery failed for client " + payload.getClientSystemName() + ". Error: " + e.getMessage()
            );
            
            throw new RuntimeException("Webhook delivery failed: " + e.getMessage());
        }
    }
}