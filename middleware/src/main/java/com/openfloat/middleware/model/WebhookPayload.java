package com.openfloat.middleware.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WebhookPayload implements Serializable {
    private String referenceCode;
    private String clientSystemName;
    private String targetUrl;
    private Map<String, Object> paymentData;
}