package com.openfloat.middleware.controller;

import com.openfloat.middleware.dto.DarajaStkPushResponse;
import com.openfloat.middleware.dto.StkPushRequest;
import com.openfloat.middleware.service.StkPushService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class StkPushController {

    private final StkPushService stkPushService;

    @PostMapping("/stk-push")
    public ResponseEntity<DarajaStkPushResponse> initiateStkPush(@Valid @RequestBody StkPushRequest request) {
        
        // Pass the sanitized request to our perfectly built service
        DarajaStkPushResponse response = stkPushService.sendPush(request);
        
        // Return Safaricom's immediate tracking ID back to the client
        return ResponseEntity.ok(response);
    }
}