package com.openfloat.middleware.listener;

import com.openfloat.middleware.dto.PaymentEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ErpIntegrationListener {

    /**
     * Consumes events from the main queue.
     * Automatically applies exponential backoff if an exception is thrown.
     */
    @RabbitListener(queues = "${openfloat.rabbitmq.queue}")
    public void processErpPosting(PaymentEvent event) {
        log.info("Received event for ERP posting. Invoice: {}, Amount: KES {}", event.invoiceNo(), event.amount());

        try {
            // TODO: Implement actual HTTP POST to external ERP (SAP/Dynamics/Oracle)
            simulateErpApiCall(event);
            
            log.info("Successfully posted Invoice {} to external ERP.", event.invoiceNo());
            
        } catch (Exception e) {
            log.error("Failed to post Invoice {} to ERP. Exception: {}. Triggering backoff retry...", event.invoiceNo(), e.getMessage());
            // Throwing an exception tells RabbitMQ the processing failed, triggering the 3 max-attempts
            throw new RuntimeException("ERP Connection Failure: " + e.getMessage());
        }
    }

    /**
     * Consumes events that have exhausted all 3 retry attempts and landed in the DLQ.
     */
    @RabbitListener(queues = "${openfloat.rabbitmq.queue}.dlq")
    public void processDeadLetterQueue(PaymentEvent event) {
        log.error("CRITICAL ALARM: Event for Invoice {} reached the Dead-Letter Queue (DLQ). Manual intervention required.", event.invoiceNo());
        
        // TODO: Update database status to "REQUIRES_MANUAL_RECONCILIATION"
        // TODO: Call NotificationService to alert Finance Support Team via email
    }

    // Mock method simulating an external ERP HTTP call
    private void simulateErpApiCall(PaymentEvent event) throws Exception {
        // Simulating a random 503 error to test your Exponential Backoff and DLQ routing
        if (Math.random() > 0.7) {
            throw new Exception("503 Service Unavailable from Target ERP");
        }
    }
}