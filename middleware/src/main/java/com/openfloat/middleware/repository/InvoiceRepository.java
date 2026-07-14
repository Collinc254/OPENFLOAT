package com.openfloat.middleware.repository;

import com.openfloat.middleware.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;



public interface InvoiceRepository extends JpaRepository<Invoice, String> {
    // We don't need any custom methods yet. 
    // JpaRepository gives us save(), findById(), etc., for free.
}