package com.openfloat.middleware.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.Callable;

@Service
public class MpesaMetricsService {

    private final Counter successfulCallbacks;
    private final Counter failedCallbacks;
    private final Timer mpesaApiLatency;

    public MpesaMetricsService(MeterRegistry meterRegistry) {
        // Initializes a counter to track successful C2B/B2C callbacks
        this.successfulCallbacks = Counter.builder("mpesa_callbacks_total")
                .tag("status", "success")
                .description("Total number of successfully processed M-Pesa callbacks")
                .register(meterRegistry);

        // Initializes a counter to track failed callbacks or invalid signatures
        this.failedCallbacks = Counter.builder("mpesa_callbacks_total")
                .tag("status", "failure")
                .description("Total number of failed M-Pesa callbacks")
                .register(meterRegistry);

        // Initializes a timer to track the exact millisecond latency of outgoing Daraja API requests
        this.mpesaApiLatency = Timer.builder("mpesa_api_latency_seconds")
                .description("Time taken to receive a response from Safaricom Daraja API")
                .register(meterRegistry);
    }

    public void incrementSuccessfulCallback() {
        this.successfulCallbacks.increment();
    }

    public void incrementFailedCallback() {
        this.failedCallbacks.increment();
    }

    /**
     * Wraps any M-Pesa API call to automatically measure and record its execution time.
     */
    public <T> T recordApiLatency(Callable<T> apiCall) throws Exception {
        long startTime = System.currentTimeMillis();
        try {
            return apiCall.call();
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            mpesaApiLatency.record(Duration.ofMillis(duration));
        }
    }
}