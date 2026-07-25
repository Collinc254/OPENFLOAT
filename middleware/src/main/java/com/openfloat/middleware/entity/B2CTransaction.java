package com.openfloat.middleware.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp; // Added missing import

import java.time.LocalDateTime;

@Entity
@Table(name = "b2c_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class B2CTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "originator_conversation_id", unique = true, nullable = false)
    private String originatorConversationId;

    @Column(name = "conversation_id")
    private String conversationId;

    @Column(name = "transaction_id")
    private String transactionId;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "amount")
    private String amount;

    @Column(name = "result_code")
    private String resultCode;

    @Column(name = "result_description", columnDefinition = "TEXT")
    private String resultDescription;

    @Column(name = "status", nullable = false)
    private String status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}