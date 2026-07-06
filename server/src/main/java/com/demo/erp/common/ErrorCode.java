package com.demo.erp.common;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    SUCCESS("SUCCESS", HttpStatus.OK),
    BUSINESS_ERROR("BUSINESS_ERROR", HttpStatus.BAD_REQUEST),
    VALIDATION_ERROR("VALIDATION_ERROR", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED("UNAUTHORIZED", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("FORBIDDEN", HttpStatus.FORBIDDEN),
    DUPLICATE_KEY("DUPLICATE_KEY", HttpStatus.CONFLICT),
    TOO_MANY_REQUESTS("TOO_MANY_REQUESTS", HttpStatus.TOO_MANY_REQUESTS),
    SYSTEM_ERROR("SYSTEM_ERROR", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String code;
    private final HttpStatus status;

    ErrorCode(String code, HttpStatus status) {
        this.code = code;
        this.status = status;
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
