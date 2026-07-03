package com.demo.erp.service;

public interface IdempotencyService {

    void requireFirstExecution(String scope, String key);
}