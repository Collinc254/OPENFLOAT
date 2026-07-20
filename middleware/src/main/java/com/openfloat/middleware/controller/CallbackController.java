package com.openfloat.middleware.controller;

import com.openfloat.middleware.dto.StkCallbackResponse;
import com.openfloat.middleware.model.MpesaTransaction;
import com.openfloat.middleware.repository.TransactionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/callbacks")
public class CallbackController {

    private final TransactionRepository transactionRepository;

    // Constructor Injection
    public CallbackController(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @PostMapping("/stk")
    public ResponseEntity<String> handleStkCallback(@RequestBody StkCallbackResponse payload) {
        
        StkCallbackResponse.StkCallback callbackData = payload.getBody().getStkCallback();
        
        // Safaricom uses CheckoutRequestID as the unique identifier for the transaction session
        String checkoutRequestId = callbackData.getCheckoutRequestId();
        int resultCode = callbackData.getResultCode();

        // 1. Find the pending transaction in the database
        Optional<MpesaTransaction> transactionOptional = transactionRepository.findById(checkoutRequestId);

        if (transactionOptional.isPresent()) {
            MpesaTransaction transaction = transactionOptional.get();

            // 2. Evaluate the ResultCode from Safaricom
            if (resultCode == 0) {
                // Payment was successful
                transaction.setStatus("PAID");
                
                // Extract ALL metadata from Safaricom's payload
                if (callbackData.getCallbackMetadata() != null && callbackData.getCallbackMetadata().getItem() != null) {
                    for (StkCallbackResponse.Item item : callbackData.getCallbackMetadata().getItem()) {
                        
                        // Safety check in case Safaricom sends a null value
                        if (item.getValue() == null) continue; 

                        String itemName = item.getName();
                        String itemValue = item.getValue().toString();

                        switch (itemName) {
                            case "MpesaReceiptNumber":
                                transaction.setMpesaRef(itemValue);
                                break;
                            case "PhoneNumber":
                                transaction.setPhone(itemValue);
                                break;
                            case "TransactionDate":
                                try {
                                    // Parse Safaricom's specific timestamp format (e.g., 20260720111507)
                                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
                                    transaction.setDate(LocalDateTime.parse(itemValue, formatter));
                                } catch (Exception e) {
                                    // Fallback to current server time if Safaricom's date fails to parse
                                    transaction.setDate(LocalDateTime.now());
                                }
                                break;
                        }
                    }
                }
            } else {
                // Payment failed (e.g., user cancelled, timeout, insufficient funds)
                transaction.setStatus("FAILED");
                transaction.setDate(LocalDateTime.now()); // Stamp the failure time
            }

            // 3. Save the comprehensively updated transaction back to the database
            transactionRepository.save(transaction);
        } else {
            // In a production environment, you would log this to a Dead Letter Queue (DLQ)
            System.out.println("Received callback for unknown transaction: " + checkoutRequestId);
        }

        // 4. Safaricom expects a generic success acknowledgment so they stop retrying
        return ResponseEntity.ok("{\"ResultCode\": 0, \"ResultDesc\": \"Accepted\"}");
    }
}