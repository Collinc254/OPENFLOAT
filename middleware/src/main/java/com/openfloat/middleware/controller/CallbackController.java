package com.openfloat.middleware.controller;

import com.openfloat.middleware.dto.StkCallbackResponse;
import com.openfloat.middleware.model.MpesaTransaction;
import com.openfloat.middleware.repository.TransactionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        // (Assuming you saved the transaction when the STK push was initially triggered)
        Optional<MpesaTransaction> transactionOptional = transactionRepository.findById(checkoutRequestId);

        if (transactionOptional.isPresent()) {
            MpesaTransaction transaction = transactionOptional.get();

            // 2. Evaluate the ResultCode from Safaricom
            if (resultCode == 0) {
                // Payment was successful
                transaction.setStatus("PAID");
                
                // Extract the actual M-Pesa receipt string (e.g., "NLJ7RT61SV") from the metadata array
                if (callbackData.getCallbackMetadata() != null) {
                    for (StkCallbackResponse.Item item : callbackData.getCallbackMetadata().getItem()) {
                        if ("MpesaReceiptNumber".equals(item.getName())) {
                            transaction.setMpesaRef(item.getValue().toString());
                            break;
                        }
                    }
                }
            } else {
                // Payment failed (e.g., user cancelled, timeout, insufficient funds)
                transaction.setStatus("FAILED");
            }

            // 3. Save the updated status back to the database
            transactionRepository.save(transaction);
        } else {
            // In a production environment, you would log this to a Dead Letter Queue (DLQ)
            System.out.println("Received callback for unknown transaction: " + checkoutRequestId);
        }

        // 4. Safaricom expects a generic success acknowledgment so they stop retrying
        return ResponseEntity.ok("{\"ResultCode\": 0, \"ResultDesc\": \"Accepted\"}");
    }
}