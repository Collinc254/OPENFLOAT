package com.openfloat.middleware.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openfloat.middleware.repository.B2CTransactionRepository;
import com.openfloat.middleware.service.B2CService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/v1/b2c")
@RequiredArgsConstructor
public class B2CController {

    private final B2CService b2cService;
    private final B2CTransactionRepository transactionRepository;
    private final ObjectMapper objectMapper;

    @PostMapping("/simulate")
    public ResponseEntity<String> simulateB2C(@RequestParam String phoneNumber, @RequestParam String amount) {
        log.info("Simulating B2C payment to {} for amount {}", phoneNumber, amount);
        
        // Hardcoded simulation values
        String commandId = "BusinessPayment";
        String remarks = "OpenFloat Test Payment";
        String occasion = "Test";

        String response = b2cService.sendB2CPayment(phoneNumber, amount, commandId, remarks, occasion);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/result")
    public ResponseEntity<String> handleB2CResult(@RequestBody String payload) {
        log.info("Safaricom B2C Result Callback Received: {}", payload);
        
        try {
            JsonNode rootNode = objectMapper.readTree(payload);
            JsonNode resultNode = rootNode.path("Result");
            
            String originatorId = resultNode.path("OriginatorConversationID").asText();
            String resultCode = resultNode.path("ResultCode").asText();
            String resultDesc = resultNode.path("ResultDesc").asText();
            String transactionId = resultNode.path("TransactionID").asText();

            // Find the pending transaction in the database and update it
            transactionRepository.findByOriginatorConversationId(originatorId).ifPresent(transaction -> {
                transaction.setResultCode(resultCode);
                transaction.setResultDescription(resultDesc);
                transaction.setTransactionId(transactionId);
                
                if ("0".equals(resultCode)) {
                    transaction.setStatus("SUCCESS");
                } else {
                    transaction.setStatus("FAILED");
                }
                
                transactionRepository.save(transaction);
                log.info("Database successfully updated for transaction: {}", originatorId);
            });

        } catch (Exception e) {
            log.error("Error processing B2C callback: {}", e.getMessage());
        }
        
        // Always return a success acknowledgment to Safaricom so they stop retrying
        return ResponseEntity.ok("{\"ResultCode\": 0, \"ResultDesc\": \"Accepted\"}");
    }

    @PostMapping("/timeout")
    public ResponseEntity<String> handleB2CTimeout(@RequestBody String payload) {
        log.warn("Safaricom B2C Timeout Callback Received: {}", payload);
        return ResponseEntity.ok("{\"ResultCode\": 0, \"ResultDesc\": \"Accepted\"}");
    }
}