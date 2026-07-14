package com.openfloat.middleware.service;

import com.openfloat.middleware.dto.PaymentEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventPublisherService {

    private final RabbitTemplate rabbitTemplate;

    @Value("${openfloat.rabbitmq.exchange}")
    private String exchange;

    @Value("${openfloat.rabbitmq.routing-key}")
    private String routingKey;

    public void publishPaymentConfirmed(PaymentEvent event) {
        log.info("Publishing payment event to ERP Queue. Reconciliation ID: {}", event.reconciliationId());
        
        rabbitTemplate.convertAndSend(exchange, routingKey, event);
        
        log.info("Event published successfully.");
    }
}