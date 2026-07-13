package com.asterflow.erp.controller;

import java.time.Instant;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public HealthResponse health() {
        return new HealthResponse("UP", "asterflow-erp-server", Instant.now());
    }

    public record HealthResponse(String status, String service, Instant timestamp) {
    }
}
