package com.asterflow.erp.service;

import com.asterflow.erp.dto.ProductResponse;

import java.util.Optional;

public interface ProductCacheService {

    Optional<ProductResponse> getProduct(Long id);

    boolean isKnownMissing(Long id);

    void setProduct(ProductResponse product);

    void setMissing(Long id);

    void evictProduct(Long id);

    RebuildLock tryAcquireRebuildLock(Long id);

    void releaseRebuildLock(Long id, String token);

    enum RebuildLockStatus {
        ACQUIRED,
        BUSY,
        UNAVAILABLE
    }

    record RebuildLock(RebuildLockStatus status, String token) {

        public static RebuildLock acquired(String token) {
            return new RebuildLock(RebuildLockStatus.ACQUIRED, token);
        }

        public static RebuildLock busy() {
            return new RebuildLock(RebuildLockStatus.BUSY, null);
        }

        public static RebuildLock unavailable() {
            return new RebuildLock(RebuildLockStatus.UNAVAILABLE, null);
        }

        public boolean isAcquired() {
            return status == RebuildLockStatus.ACQUIRED;
        }

        public boolean isBusy() {
            return status == RebuildLockStatus.BUSY;
        }

        public boolean isUnavailable() {
            return status == RebuildLockStatus.UNAVAILABLE;
        }
    }
}
