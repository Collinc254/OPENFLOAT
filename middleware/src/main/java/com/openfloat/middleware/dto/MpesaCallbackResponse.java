package com.openfloat.middleware.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MpesaCallbackResponse(
    @JsonProperty("ResultCode")
    int resultCode,
    
    @JsonProperty("ResultDesc")
    String resultDesc
) {
    // Helper method to quickly generate a success response
    public static MpesaCallbackResponse accept() {
        return new MpesaCallbackResponse(0, "Accepted");
    }

    // Helper method to quickly generate a failure response
    public static MpesaCallbackResponse reject(String reason) {
        return new MpesaCallbackResponse(1, "Rejected: " + reason);
    }
}