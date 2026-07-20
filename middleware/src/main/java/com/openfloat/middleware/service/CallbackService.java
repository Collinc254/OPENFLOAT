package com.openfloat.middleware.service;

import com.openfloat.middleware.dto.MpesaCallbackRequest;
import com.openfloat.middleware.dto.MpesaCallbackResponse;
import com.openfloat.middleware.dto.MpesaConfirmationRequest;
import com.openfloat.middleware.dto.PaymentEvent;
import com.openfloat.middleware.exception.ValidationRejectedException;
import com.openfloat.middleware.model.Invoice;
import com.openfloat.middleware.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class CallbackService {

    private final InvoiceRepository invoiceRepository;
    private final EventPublisherService eventPublisherService;

    @Transactional(readOnly = true)
    public MpesaCallbackResponse validatePayment(MpesaCallbackRequest request) {
        String invoiceNo = request.billRefNumber();

        // 1. Fetch and assign the invoice variable
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNo)
                .orElseThrow(() -> new ValidationRejectedException("Invalid account reference. Invoice not found."));

        if (!invoice.getTenant().isActive()) {
            throw new ValidationRejectedException("Target service is currently inactive.");
        }

        if (request.transAmount().compareTo(invoice.getAmount()) != 0) {
            throw new ValidationRejectedException("Amount mismatch. Expected: " + invoice.getAmount());
        }

        return MpesaCallbackResponse.accept();
    }

    @Transactional
    public String confirmPayment(MpesaConfirmationRequest request) {
        String invoiceNo = request.billRefNumber();

        // 2. Fetch and assign the invoice variable
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNo)
                .orElseThrow(() -> new IllegalArgumentException("Received confirmation for unknown invoice: " + invoiceNo));

        if ("PAID".equals(invoice.getStatus())) {
            log.warn("Duplicate confirmation received for invoice: {}. Safaricom TransID: {}", invoiceNo, request.transId());
            return "Acknowledged Duplicate";
        }

        invoice.setStatus("PAID");
        invoiceRepository.save(invoice);

        log.info("Successfully confirmed payment for Invoice: {} Amount: {}", invoiceNo, request.transAmount());

        // 3. Build the payload for the ERP system
        PaymentEvent paymentEvent = new PaymentEvent(
            request.transId(), // Using M-Pesa Receipt Number as the reconciliation ID
            invoice.getInvoiceNumber(),
            request.msisdn(),
            request.transAmount(),
            invoice.getServiceRef(),
            LocalDateTime.now()
        );

        // 4. Publish the event to RabbitMQ
        eventPublisherService.publishPaymentConfirmed(paymentEvent);

        return "Acknowledged";
    }
}