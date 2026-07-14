package com.openfloat.middleware.controller;

import com.openfloat.middleware.dto.MpesaCallbackRequest;
import com.openfloat.middleware.dto.MpesaCallbackResponse;
import com.openfloat.middleware.dto.MpesaConfirmationRequest;
import com.openfloat.middleware.service.CallbackService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/callbacks")
@RequiredArgsConstructor
public class CallbackController {

    private final CallbackService callbackService;

    // --- Existing C2B Endpoints ---

    @PostMapping("/validation")
    public ResponseEntity<MpesaCallbackResponse> handleValidationCallback(@RequestBody MpesaCallbackRequest request) {
        MpesaCallbackResponse response = callbackService.validatePayment(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/confirmation")
    public ResponseEntity<Map<String, String>> handleConfirmationCallback(@RequestBody MpesaConfirmationRequest request) {
        String result = callbackService.confirmPayment(request);
        
        // Safaricom expects a simple JSON acknowledgment for confirmations to stop their retry mechanisms
        return ResponseEntity.ok(Map.of("ResultCode", "0", "ResultDesc", result));
    }

    // --- NEW: STK Push Callback Endpoint ---

    @PostMapping("/stk-push")
    public ResponseEntity<String> handleStkCallback(@RequestBody String payload) {
        
        // For right now, we will just print the raw JSON to the terminal
        // so you can see exactly what Safaricom sends back.
        log.info("RECEIVED SAFARICOM STK PUSH CALLBACK: \n{}", payload);
        
        // You must ALWAYS return a 200 OK to Safaricom immediately.
        // If you don't, Safaricom assumes the callback failed and will keep spamming your server.
        return ResponseEntity.ok("Acknowledged");
    }
}