package com.openfloat.middleware.dto;

import java.util.List;

public record AuditReportResponse(
    int totalProcessed,
    int successfulMatches,
    List<String> missingInDatabase,
    List<String> mismatchedAmounts
) {}