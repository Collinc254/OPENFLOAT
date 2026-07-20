package com.openfloat.middleware.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceRequest {
    private String tenantId;
    private BigDecimal amount;
    private String msisdn;
    private String serviceRef;
}