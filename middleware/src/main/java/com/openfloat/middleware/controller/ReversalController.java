package com.openfloat.middleware.controller;

import com.openfloat.middleware.dto.ReversalRequest;
import com.openfloat.middleware.service.ReversalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reversals")
@RequiredArgsConstructor
public class ReversalController {

    private final ReversalService reversalService;

    @PostMapping("/initiate")
    @PreAuthorize("hasAuthority('PROCESS_REFUNDS') or hasAuthority('ADMIN')")
    public ResponseEntity<?> initiateReversal(@RequestBody ReversalRequest request) {
        return reversalService.initiateReversal(request);
    }

    // Safaricom Callback Endpoints for Reversal
    @PostMapping("/result")
    public ResponseEntity<String> handleReversalResult(@RequestBody String payload) {
        // TODO: Save reversal status to the database
        return ResponseEntity.ok("{\"ResultCode\": 0, \"ResultDesc\": \"Accepted\"}");
    }

    @PostMapping("/timeout")
    public ResponseEntity<String> handleReversalTimeout(@RequestBody String payload) {
        return ResponseEntity.ok("{\"ResultCode\": 0, \"ResultDesc\": \"Accepted\"}");
    }
}