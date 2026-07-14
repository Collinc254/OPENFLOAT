package com.openfloat.middleware.exception;

public class ValidationRejectedException extends RuntimeException {
    public ValidationRejectedException(String message) {
        super(message);
    }
}