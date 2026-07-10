package com.asterflow.erp.service.impl;

import com.asterflow.erp.dto.ProductResponse;
import com.asterflow.erp.service.ProductCacheService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@ConditionalOnProperty(name = "erp.cache.type", havingValue = "local", matchIfMissing = true)
public class LocalProductCacheServiceImpl implements ProductCacheService {

    private final ConcurrentMap<Long, CacheEntry> cache = new ConcurrentHashMap<>();
    private final Duration detailTtl;
    private final Duration missingTtl;

    public LocalProductCacheServiceImpl(
            @Value("${erp.cache.product-detail-ttl-seconds:300}") long detailTtlSeconds,
            @Value("${erp.cache.product-missing-ttl-seconds:30}") long missingTtlSeconds
    ) {
        this.detailTtl = Duration.ofSeconds(detailTtlSeconds);
        this.missingTtl = Duration.ofSeconds(missingTtlSeconds);
    }

    @Override
    public Optional<ProductResponse> getProduct(Long id) {
        CacheEntry entry = activeEntry(id);

        if (entry == null || entry.missing()) {
            return Optional.empty();
        }

        return Optional.of(entry.product());
    }

    @Override
    public boolean isKnownMissing(Long id) {
        CacheEntry entry = activeEntry(id);
        return entry != null && entry.missing();
    }

    @Override
    public void setProduct(ProductResponse product) {
        if (product == null || product.getId() == null) {
            return;
        }

        cache.put(product.getId(), CacheEntry.product(product, LocalDateTime.now().plus(detailTtl)));
    }

    @Override
    public void setMissing(Long id) {
        if (id == null) {
            return;
        }

        cache.put(id, CacheEntry.missing(LocalDateTime.now().plus(missingTtl)));
    }

    @Override
    public void evictProduct(Long id) {
        if (id != null) {
            cache.remove(id);
        }
    }

    private CacheEntry activeEntry(Long id) {
        if (id == null) {
            return null;
        }

        CacheEntry entry = cache.get(id);

        if (entry == null) {
            return null;
        }

        if (LocalDateTime.now().isAfter(entry.expireAt())) {
            cache.remove(id);
            return null;
        }

        return entry;
    }

    private record CacheEntry(ProductResponse product, boolean missing, LocalDateTime expireAt) {

        static CacheEntry product(ProductResponse product, LocalDateTime expireAt) {
            return new CacheEntry(product, false, expireAt);
        }

        static CacheEntry missing(LocalDateTime expireAt) {
            return new CacheEntry(null, true, expireAt);
        }
    }
}
