package com.openfloat.middleware.dto;

import jakarta.validation.constraints.NotBlank;

public record ResolveTransactionRequest(
    @NotBlank(message = "Transaction ID is required")
    String id,
    
    @NotBlank(message = "Target system must be specified")
    String system,
    
    @NotBlank(message = "Reconciliation note is required for the audit trail")
    String note
) {}