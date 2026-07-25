package com.openfloat.middleware.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record C2bResponse(
    @JsonProperty("ResultCode") String resultCode,
    @JsonProperty("ResultDesc") String resultDesc
) {}