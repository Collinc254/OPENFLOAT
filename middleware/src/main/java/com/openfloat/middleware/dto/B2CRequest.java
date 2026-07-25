package com.openfloat.middleware.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class B2CRequest {

    @JsonProperty("InitiatorName")
    private String InitiatorName;

    @JsonProperty("SecurityCredential")
    private String SecurityCredential;

    @JsonProperty("CommandID")
    private String CommandID;

    @JsonProperty("Amount")
    private String Amount;

    @JsonProperty("PartyA")
    private String PartyA;

    @JsonProperty("PartyB")
    private String PartyB;

    @JsonProperty("Remarks")
    private String Remarks;

    @JsonProperty("QueueTimeOutURL")
    private String QueueTimeOutURL;

    @JsonProperty("ResultURL")
    private String ResultURL;

    @JsonProperty("Occasion")
    private String Occasion;
}