package com.openfloat.middleware.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class MpesaTransaction {

    @Id
    private String id;

    private String mpesaRef;
    private String phone;
    private BigDecimal amount;
    private String type;
    private String status;
    private String checkoutRequestId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime date;

    public MpesaTransaction() {}

    public MpesaTransaction(String id, String mpesaRef, String phone, BigDecimal amount, String type, String status, String checkoutRequestId, LocalDateTime date) {
        this.id = id;
        this.mpesaRef = mpesaRef;
        this.phone = phone;
        this.amount = amount;
        this.type = type;
        this.status = status;
        this.checkoutRequestId = checkoutRequestId;
        this.date = date;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMpesaRef() { return mpesaRef; }
    public void setMpesaRef(String mpesaRef) { this.mpesaRef = mpesaRef; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCheckoutRequestId() { return checkoutRequestId; }
    public void setCheckoutRequestId(String checkoutRequestId) { this.checkoutRequestId = checkoutRequestId; }

    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }
}