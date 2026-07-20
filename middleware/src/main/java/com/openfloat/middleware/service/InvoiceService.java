package com.openfloat.middleware.service;

import com.openfloat.middleware.dto.InvoiceRequest;
import com.openfloat.middleware.dto.InvoiceResponse;
import com.openfloat.middleware.model.Invoice;
import com.openfloat.middleware.model.Tenant;
import com.openfloat.middleware.repository.InvoiceRepository;
import com.openfloat.middleware.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final TenantRepository tenantRepository;
    private final InvoiceRepository invoiceRepository;

    @Transactional
    public InvoiceResponse createInvoice(InvoiceRequest request) {
        Tenant tenant = tenantRepository.findByTenantIdAndIsActiveTrue(request.getTenantId())
                .orElseThrow(() -> new SecurityException("Invalid or inactive Tenant ID"));

        String invoiceNo = "INV-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(invoiceNo);
        invoice.setTenant(tenant);
        invoice.setAmount(request.getAmount());
        invoice.setCustomerMsisdn(request.getMsisdn());
        invoice.setServiceRef(request.getServiceRef());
        
        Invoice savedInvoice = invoiceRepository.save(invoice);
        
        log.info("Invoice {} created for Tenant: {} expecting Ksh {}", invoiceNo, tenant.getTenantId(), request.getAmount());

        return InvoiceResponse.builder()
                .invoiceNumber(savedInvoice.getInvoiceNumber())
                .amount(savedInvoice.getAmount())
                .customerMsisdn(savedInvoice.getCustomerMsisdn())
                .serviceRef(savedInvoice.getServiceRef())
                .status(savedInvoice.getStatus())
                .build();
    }
}