package com.openfloat.middleware.dto;

public record ReversalRequest(
    String transactionId, // The original M-Pesa receipt to reverse (e.g., OEI2AXXXXX)
    String amount,
    String receiverParty, // The Paybill or Till Number
    String remarks,
    String occasion
) {}