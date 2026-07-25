package com.openfloat.middleware.controller;

import com.openfloat.middleware.dto.C2bRequest;
import com.openfloat.middleware.dto.C2bResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/c2b")
public class C2bController {

    // DOOR 1: Safaricom knocks here first to ask if the account is valid
    @PostMapping("/validation")
    public ResponseEntity<C2bResponse> validateTransaction(@RequestBody C2bRequest request) {
        
        System.out.println("Safaricom is validating account: " + request.billRefNumber());

        // We respond with "0" which tells Safaricom "Yes, accept this money"
        C2bResponse response = new C2bResponse("0", "Accepted");
        return ResponseEntity.ok(response);
    }

    // DOOR 2: Safaricom knocks here second to confirm the money has arrived
    @PostMapping("/confirmation")
    public ResponseEntity<C2bResponse> confirmTransaction(@RequestBody C2bRequest request) {
        
        System.out.println("Money received from: " + request.msisdn() + " Amount: " + request.transAmount());

        // We respond with "0" to tell Safaricom we received the notification
        C2bResponse response = new C2bResponse("0", "Success");
        return ResponseEntity.ok(response);
    }
}