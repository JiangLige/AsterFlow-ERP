package com.asterflow.erp.service;

import com.asterflow.erp.dto.ProductResponse;

import java.util.Optional;

public interface ProductCacheService {

    Optional<ProductResponse> getProduct(Long id);

    boolean isKnownMissing(Long id);

    void setProduct(ProductResponse product);

    void setMissing(Long id);

    void evictProduct(Long id);
}
