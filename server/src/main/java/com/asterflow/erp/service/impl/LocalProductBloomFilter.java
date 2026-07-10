package com.asterflow.erp.service.impl;

import com.asterflow.erp.service.ProductBloomFilter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@ConditionalOnProperty(name = "erp.cache.type", havingValue = "local", matchIfMissing = true)
public class LocalProductBloomFilter implements ProductBloomFilter {

    private final Set<Long> productIds = ConcurrentHashMap.newKeySet();

    @Override
    public boolean mightContain(Long productId) {
        return productId != null && productIds.contains(productId);
    }

    @Override
    public void put(Long productId) {
        if (productId != null) {
            productIds.add(productId);
        }
    }
}
