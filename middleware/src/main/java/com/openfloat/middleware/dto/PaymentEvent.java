package com.openfloat.middleware.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentEvent(
    String reconciliationId,
    String invoiceNo,
    String msisdn,
    BigDecimal amount,
    String accountReference,
    LocalDateTime transactionDate
) {}