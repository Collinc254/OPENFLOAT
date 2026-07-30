package com.openfloat.middleware.model;

import lombok.Data;

@Data
public class RegisterClientRequest {
    private String systemName;
    private String webhookUrl;
    private Integer rateLimitPerMinute;
}