package com.openfloat.middleware.controller;

import com.openfloat.middleware.dto.DarajaStkPushResponse;
import com.openfloat.middleware.dto.StkPushRequest;
import com.openfloat.middleware.service.StkPushService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
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

    // NEW: The Daraja Callback Receiver
    @PostMapping("/callback")
    public ResponseEntity<String> handleDarajaCallback(@RequestBody String callbackPayload) {
        // 1. Log the raw JSON from Safaricom so we can see it in Render logs
        log.info("DARAJA CALLBACK RECEIVED: {}", callbackPayload);
        
        // 2. You MUST return a 200 OK success message to Safaricom, otherwise they will keep retrying
        return ResponseEntity.ok("Callback received successfully");
    }
}