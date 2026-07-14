package com.openfloat.middleware.controller;

import com.openfloat.middleware.dto.InvoiceRequest;
import com.openfloat.middleware.dto.InvoiceResponse;
import com.openfloat.middleware.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<InvoiceResponse> requestInvoice(@Valid @RequestBody InvoiceRequest request) {
        InvoiceResponse response = invoiceService.createInvoice(request);
        
        // Returns a 201 Created status code along with the response payload
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}