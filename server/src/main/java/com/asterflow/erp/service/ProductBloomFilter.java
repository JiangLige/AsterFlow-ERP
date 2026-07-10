package com.asterflow.erp.service;

public interface ProductBloomFilter {

    boolean mightContain(Long productId);

    void put(Long productId);
}
