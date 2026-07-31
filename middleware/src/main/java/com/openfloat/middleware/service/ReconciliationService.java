package com.openfloat.middleware.service;

import com.openfloat.middleware.dto.AuditReportResponse;
import com.openfloat.middleware.model.MpesaTransaction;
import com.openfloat.middleware.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReconciliationService {

    private final TransactionRepository transactionRepository;

    public AuditReportResponse processProviderStatement(MultipartFile file) {
        List<String> missingInDatabase = new ArrayList<>();
        List<String> mismatchedAmounts = new ArrayList<>();
        int totalProcessed = 0;
        int successfulMatches = 0;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean isFirstLine = true;

            while ((line = br.readLine()) != null) {
                if (isFirstLine) {
                    isFirstLine = false;
                    continue; // Skip the CSV header row
                }

                // Standard Safaricom CSV layout mapping
                // Format: Receipt, CompletionTime, Details, Status, PaidIn, Withdrawn, Balance
                String[] data = line.split(",");
                if (data.length < 5) continue;

                String receipt = data[0].trim();
                String paidInStr = data[4].trim();

                if (receipt.isEmpty() || paidInStr.isEmpty()) continue;

                totalProcessed++;
                
                try {
                    BigDecimal providerAmount = new BigDecimal(paidInStr);
                    
                    // Cross-reference with the database
                    Optional<MpesaTransaction> txOpt = transactionRepository.findByMpesaRef(receipt);

                    if (txOpt.isEmpty()) {
                        missingInDatabase.add("Receipt: " + receipt + " | Missing in OpenFloat");
                    } else {
                        MpesaTransaction tx = txOpt.get();
                        
                        // Compare the exact financial amounts
                        if (tx.getAmount().compareTo(providerAmount) != 0) {
                            mismatchedAmounts.add("Receipt: " + receipt + " | DB: KES " + tx.getAmount() + " vs Provider: KES " + providerAmount);
                        } else {
                            successfulMatches++;
                        }
                    }
                } catch (NumberFormatException e) {
                    log.warn("Could not parse numeric amount for receipt {}: {}", receipt, paidInStr);
                }
            }
        } catch (Exception e) {
            log.error("Failed to process reconciliation file", e);
            throw new RuntimeException("Failed to process file. Ensure it is a valid CSV format.");
        }

        return new AuditReportResponse(totalProcessed, successfulMatches, missingInDatabase, mismatchedAmounts);
    }
}