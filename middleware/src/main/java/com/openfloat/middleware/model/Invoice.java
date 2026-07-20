package com.openfloat.middleware.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "invoices")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String invoiceNumber;

    @Column(nullable = false)
    private BigDecimal amount;

    private String serviceRef;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(nullable = false)
    private String customerMsisdn;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, PAID, FAILED

    private LocalDateTime issuedAt = LocalDateTime.now();

    // Explicit alias getters to satisfy CallbackService references
    public String getInvoiceNo() {
        return this.invoiceNumber;
    }
}