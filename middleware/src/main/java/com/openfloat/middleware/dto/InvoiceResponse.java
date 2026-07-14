package com.openfloat.middleware.dto;

import java.math.BigDecimal;

public record InvoiceResponse(
    String invoiceNo,
    String paybill,
    BigDecimal amount,
    String status
) {}