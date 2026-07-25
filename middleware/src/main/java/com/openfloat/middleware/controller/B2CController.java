package com.openfloat.middleware.controller;

import com.openfloat.middleware.service.B2CService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/b2c")
@RequiredArgsConstructor
public class B2CController {

    private final B2CService b2cService;

    @PostMapping("/simulate")
    public ResponseEntity<String> simulateB2C(
            @RequestParam String phoneNumber, 
            @RequestParam String amount) {
        
        log.info("Simulating B2C payment to {} for amount {}", phoneNumber, amount);
        
        // Triggers the entire flow: fetches token, encrypts password, and sends payload
        String response = b2cService.sendB2CPayment(
                phoneNumber, 
                amount, 
                "BusinessPayment", 
                "Openfloat Payout", 
                "Testing B2C"
        );
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/result")
    public ResponseEntity<String> handleB2CResult(@RequestBody String payload) {
        log.info("Safaricom B2C Result Callback Received: {}", payload);
        return ResponseEntity.ok("{\"ResultCode\": \"0\", \"ResultDesc\": \"Accepted\"}");
    }

    @PostMapping("/timeout")
    public ResponseEntity<String> handleB2CTimeout(@RequestBody String payload) {
        log.error("Safaricom B2C Timeout Callback Received: {}", payload);
        return ResponseEntity.ok("{\"ResultCode\": \"0\", \"ResultDesc\": \"Accepted\"}");
    }
}