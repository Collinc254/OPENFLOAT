package com.openfloat.middleware.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Convert;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.openfloat.middleware.security.AttributeEncryptor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class MpesaTransaction {

    // Acts as the Account Reference / Invoice Ref
    @Id
    private String id;

    private String mpesaRef; // Transaction ID

    @Convert(converter = AttributeEncryptor.class)
    private String phone;

    private BigDecimal amount;
    private String type;
    
    // Core Transaction Status (PENDING, PAID, FAILED, CANCELLED, REVERSED, REFUNDED)
    private String status; 
    
    private String checkoutRequestId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime date;

    // ==========================================
    // NEW DASHBOARD TRACKING FIELDS
    // ==========================================
    private String paymentProvider = "M-PESA";
    private String paybillNumber;
    private String clientSystemName;
    private String callbackStatus = "PENDING"; 
    private String settlementStatus = "UNSETTLED"; 

    public MpesaTransaction() {}

    public MpesaTransaction(String id, String mpesaRef, String phone, BigDecimal amount, String type, String status, String checkoutRequestId, LocalDateTime date, String paymentProvider, String paybillNumber, String clientSystemName, String callbackStatus, String settlementStatus) {
        this.id = id;
        this.mpesaRef = mpesaRef;
        this.phone = phone;
        this.amount = amount;
        this.type = type;
        this.status = status;
        this.checkoutRequestId = checkoutRequestId;
        this.date = date;
        this.paymentProvider = paymentProvider;
        this.paybillNumber = paybillNumber;
        this.clientSystemName = clientSystemName;
        this.callbackStatus = callbackStatus;
        this.settlementStatus = settlementStatus;
    }

    // ==========================================
    // GETTERS AND SETTERS
    // ==========================================
    
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

    public String getPaymentProvider() { return paymentProvider; }
    public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }

    public String getPaybillNumber() { return paybillNumber; }
    public void setPaybillNumber(String paybillNumber) { this.paybillNumber = paybillNumber; }

    public String getClientSystemName() { return clientSystemName; }
    public void setClientSystemName(String clientSystemName) { this.clientSystemName = clientSystemName; }

    public String getCallbackStatus() { return callbackStatus; }
    public void setCallbackStatus(String callbackStatus) { this.callbackStatus = callbackStatus; }

    public String getSettlementStatus() { return settlementStatus; }
    public void setSettlementStatus(String settlementStatus) { this.settlementStatus = settlementStatus; }
}