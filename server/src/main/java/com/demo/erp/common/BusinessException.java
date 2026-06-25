package com.demo.erp.common;

public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}