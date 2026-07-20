package com.openfloat.middleware.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class InvoiceResponse {
    private String invoiceNumber;
    private BigDecimal amount;
    private String customerMsisdn;
    private String serviceRef;
    private String status;
}