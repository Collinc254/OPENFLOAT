package com.openfloat.middleware.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "webhook_delivery_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WebhookDeliveryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String referenceCode;

    @Column(nullable = false)
    private String clientSystemName;

    @Column(nullable = false)
    private String targetUrl;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String payloadSent;

    private Integer httpResponseCode;

    @Column(columnDefinition = "TEXT")
    private String responseMessage;

    @Column(nullable = false)
    private boolean successful;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime attemptedAt;
}