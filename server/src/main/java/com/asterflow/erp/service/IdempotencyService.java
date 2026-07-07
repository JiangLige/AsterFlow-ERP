package com.asterflow.erp.service;

public interface IdempotencyService {

    void requireFirstExecution(String scope, String key);
}