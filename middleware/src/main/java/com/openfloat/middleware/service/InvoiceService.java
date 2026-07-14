package com.openfloat.middleware.service;

import com.openfloat.middleware.dto.InvoiceRequest;
import com.openfloat.middleware.dto.InvoiceResponse;
import com.openfloat.middleware.exception.TenantNotFoundException;
import com.openfloat.middleware.model.Invoice;
import com.openfloat.middleware.model.Tenant;
import com.openfloat.middleware.repository.InvoiceRepository;
import com.openfloat.middleware.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final TenantRepository tenantRepository;
    private final InvoiceRepository invoiceRepository;

    // Pulls the Paybill number from your application.properties
    @Value("${safaricom.paybill:4320161}")
    private String paybill;

    @Transactional
    public InvoiceResponse createInvoice(InvoiceRequest request) {
        // 1. Verify tenant in registry
        Tenant tenant = tenantRepository.findByTenantIdAndIsActiveTrue(request.tenantId())
                .orElseThrow(() -> new TenantNotFoundException("Active tenant not found for ID: " + request.tenantId()));

        // 2. Generate unique invoice_no (INV- followed by 8 random characters)
        String invoiceNo = "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 3. Record requesting system + expected amount
        Invoice invoice = new Invoice();
        invoice.setInvoiceNo(invoiceNo);
        invoice.setTenant(tenant);
        invoice.setMsisdn(request.msisdn());
        invoice.setAmount(request.amount());
        invoice.setServiceRef(request.serviceRef());
        
        invoiceRepository.save(invoice);

        // 4. Return instructions for the tenant
        return new InvoiceResponse(invoiceNo, paybill, request.amount(), "PENDING");
    }
}