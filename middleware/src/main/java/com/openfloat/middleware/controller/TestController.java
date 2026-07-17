package com.openfloat.middleware.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/test")
public class TestController {

    @GetMapping("/secured")
    public ResponseEntity<String> testSecuredRoute() {
        return ResponseEntity.ok("Success! Your JWT token granted you access to this secure data.");
    }
}