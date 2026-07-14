package com.openfloat.middleware.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Handles cases where the Tenant ID is wrong or inactive
    @ExceptionHandler(TenantNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleTenantNotFound(TenantNotFoundException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Unauthorized");
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    // Handles validation failures from our DTO (e.g., missing phone number)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    // Handles Safaricom validation rejections cleanly
    @ExceptionHandler(ValidationRejectedException.class)
    public ResponseEntity<com.openfloat.middleware.dto.MpesaCallbackResponse> handleValidationRejection(ValidationRejectedException ex) {
        // We must return HTTP 200 OK to Safaricom, but with a ResultCode of 1 to reject the funds
        return ResponseEntity.ok(com.openfloat.middleware.dto.MpesaCallbackResponse.reject(ex.getMessage()));
    }
}