package com.openfloat.middleware.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

public record MpesaConfirmationRequest(
    @JsonProperty("TransactionType")
    String transactionType,
    
    @JsonProperty("TransID")
    String transId,
    
    @JsonProperty("TransTime")
    String transTime,
    
    @JsonProperty("TransAmount")
    BigDecimal transAmount,
    
    @JsonProperty("BusinessShortCode")
    String businessShortCode,
    
    @JsonProperty("BillRefNumber")
    String billRefNumber,
    
    @JsonProperty("InvoiceNumber")
    String invoiceNumber,
    
    @JsonProperty("MSISDN")
    String msisdn,
    
    @JsonProperty("FirstName")
    String firstName,
    
    @JsonProperty("MiddleName")
    String middleName,
    
    @JsonProperty("LastName")
    String lastName
) {}