package com.openfloat.middleware.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;

public record StkPushRequest(
    @NotBlank(message = "Customer MSISDN is required")
    @Pattern(regexp = "^254\\d{9}$", message = "MSISDN must be in the format 254XXXXXXXXX")
    String msisdn,
    
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Amount must be at least 1.00")
    BigDecimal amount,
    
    @NotBlank(message = "Invoice Reference is required")
    String invoiceRef,

    @NotBlank(message = "Tenant ID is required")
    String tenantId
) {}
