package com.openfloat.middleware.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class InvoiceRequest {
    private String tenantId;
    private BigDecimal amount;
    private String msisdn;
    private String serviceRef;
}