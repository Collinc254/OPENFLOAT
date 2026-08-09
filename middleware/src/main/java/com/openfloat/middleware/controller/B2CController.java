package com.openfloat.middleware.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openfloat.middleware.entity.B2CTransaction;
import com.openfloat.middleware.repository.B2CTransactionRepository;
import com.openfloat.middleware.service.B2CService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@CrossOrigin(originPatterns = "*", allowCredentials = "true") 
@RequestMapping("/api/v1/b2c")
@RequiredArgsConstructor
public class B2CController {
   
    private final B2CService b2cService;
    private final B2CTransactionRepository transactionRepository;
    private final ObjectMapper objectMapper;

    // ==========================================
    // MAKER: DRAFT A PAYMENT
    // ==========================================
    @PostMapping("/simulate")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('CREATE_PAYOUT')")
    public ResponseEntity<?> simulateB2C(
            @RequestParam String phoneNumber, 
            @RequestParam String amount, 
            @RequestParam String shortcode) { // ADDED: shortcode parameter
        
        log.info("Maker drafting B2C payment to {} for amount {} using Paybill {}", phoneNumber, amount, shortcode);
        
        // 1. Extract the current logged-in user's name
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUser = auth != null ? auth.getName() : "SYSTEM";

        // 2. Save as a PENDING draft instead of sending immediately
        B2CTransaction draft = new B2CTransaction();
        draft.setPhoneNumber(phoneNumber);
        draft.setAmount(amount); 
        draft.setShortcode(shortcode); // ADDED: Link draft to specific paybill
        draft.setStatus("PENDING");
        draft.setInitiatedBy(currentUser); 
        
        B2CTransaction savedDraft = transactionRepository.save(draft);

        // 3. Return the format the React frontend expects
        Map<String, String> response = new HashMap<>();
        response.put("ResponseCode", "0");
        response.put("ConversationID", "PAY-" + savedDraft.getId());
        
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // CHECKER: VIEW PENDING PAYMENTS
    // ==========================================
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('APPROVE_PAYOUT')")
    public ResponseEntity<List<Map<String, Object>>> getPendingApprovals() {
        log.info("Checker requested list of pending B2C approvals.");
        
        // Fetch all pending drafts from the repository
        List<B2CTransaction> pendingTransactions = transactionRepository.findByStatus("PENDING");
        
        List<Map<String, Object>> response = pendingTransactions.stream().map(tx -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", tx.getId());
            map.put("recipient", tx.getPhoneNumber());
            map.put("amount", tx.getAmount());
            map.put("draftedBy", tx.getInitiatedBy() != null ? tx.getInitiatedBy() : "UNKNOWN");
            map.put("shortcode", tx.getShortcode()); // ADDED: Return shortcode for UI display
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // CHECKER: APPROVE & SEND PAYMENT
    // ==========================================
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('APPROVE_PAYOUT')")
    public ResponseEntity<?> approvePayout(@PathVariable Long id) {
        log.info("Checker approving B2C transaction ID: {}", id);
        
        B2CTransaction tx = transactionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Transaction not found"));
            
        if (!"PENDING".equals(tx.getStatus())) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Transaction is already processed or not pending.");
            return ResponseEntity.badRequest().body(error);
        }

        // 1. Trigger the actual Safaricom payment
        String commandId = "BusinessPayment";
        String remarks = "OpenFloat Approved Payout";
        String occasion = "Payout";
        
        try {
            // UPDATED: Dynamically extract the shortcode chosen by the Maker
            String targetShortCode = tx.getShortcode(); 
            
            if (targetShortCode == null || targetShortCode.isEmpty()) {
                throw new RuntimeException("Draft does not have a source paybill specified.");
            }
            
            String safaricomResponse = b2cService.sendB2CPayment(
                tx, 
                commandId, 
                remarks, 
                occasion,
                targetShortCode
            );
            
            // 2. Update status so it drops off the Checker's pending list
            tx.setStatus("APPROVED_SENT");
            transactionRepository.save(tx);
            
            Map<String, String> successResponse = new HashMap<>();
            successResponse.put("message", "Approved and sent to Safaricom");
            successResponse.put("safaricomResponse", safaricomResponse);
            
            return ResponseEntity.ok(successResponse);
            
        } catch (Exception e) {
            log.error("Failed to execute approved B2C payment", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to contact Safaricom Daraja API: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    // ==========================================
    // OPEN CALLBACKS: SAFARICOM DARAJA
    // ==========================================
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
        
        return ResponseEntity.ok("{\"ResultCode\": 0, \"ResultDesc\": \"Accepted\"}");
    }

    @PostMapping("/timeout")
    public ResponseEntity<String> handleB2CTimeout(@RequestBody String payload) {
        log.warn("Safaricom B2C Timeout Callback Received: {}", payload);
        return ResponseEntity.ok("{\"ResultCode\": 0, \"ResultDesc\": \"Accepted\"}");
    }
}