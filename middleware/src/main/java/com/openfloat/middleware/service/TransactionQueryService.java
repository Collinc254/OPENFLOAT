package com.openfloat.middleware.service;

import com.openfloat.middleware.model.MpesaTransaction;
import com.openfloat.middleware.repository.TransactionRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class TransactionQueryService {

    private final TransactionRepository transactionRepository;

    public TransactionQueryService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public List<MpesaTransaction> getFilteredTransactions(
            String clientSystemName,
            Double minAmount,
            Double maxAmount,
            String phone,
            String status,
            String paymentProvider,
            String accountReference,
            LocalDateTime startDate,
            LocalDateTime endDate) {

        Specification<MpesaTransaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (clientSystemName != null && !clientSystemName.isEmpty()) {
                predicates.add(cb.equal(root.get("clientSystemName"), clientSystemName));
            }
            if (minAmount != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("amount"), minAmount));
            }
            if (maxAmount != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("amount"), maxAmount));
            }
            if (phone != null && !phone.isEmpty()) {
                predicates.add(cb.like(root.get("phone"), "%" + phone + "%"));
            }
            if (status != null && !status.isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (paymentProvider != null && !paymentProvider.isEmpty()) {
                predicates.add(cb.equal(root.get("paymentProvider"), paymentProvider));
            }
            if (accountReference != null && !accountReference.isEmpty()) {
                predicates.add(cb.equal(root.get("id"), accountReference));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("date"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Always sort by newest first for the admin dashboard
        return transactionRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "date"));
    }
}