package com.openfloat.middleware.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class B2CRequest {
    private String InitiatorName;
    private String SecurityCredential;
    private String CommandID; 
    private String Amount;
    private String PartyA;
    private String PartyB;
    private String Remarks;
    private String QueueTimeOutURL;
    private String ResultURL;
    private String Occasion;
}