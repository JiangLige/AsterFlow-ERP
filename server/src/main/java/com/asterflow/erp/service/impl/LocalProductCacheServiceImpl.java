package com.asterflow.erp.service.impl;

import com.asterflow.erp.dto.ProductResponse;
import com.asterflow.erp.service.ProductCacheService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@ConditionalOnProperty(name = "erp.cache.type", havingValue = "local", matchIfMissing = true)
public class LocalProductCacheServiceImpl implements ProductCacheService {

    private final ConcurrentMap<Long, CacheEntry> cache = new ConcurrentHashMap<>();
    private final ConcurrentMap<Long, RebuildLockEntry> rebuildLocks = new ConcurrentHashMap<>();
    private final Duration detailTtl;
    private final Duration missingTtl;
    private final Duration rebuildLockTtl;

    public LocalProductCacheServiceImpl(
            @Value("${erp.cache.product-detail-ttl-seconds:300}") long detailTtlSeconds,
            @Value("${erp.cache.product-missing-ttl-seconds:30}") long missingTtlSeconds,
            @Value("${erp.cache.product-rebuild-lock-ttl-seconds:10}") long rebuildLockTtlSeconds
    ) {
        this.detailTtl = Duration.ofSeconds(detailTtlSeconds);
        this.missingTtl = Duration.ofSeconds(missingTtlSeconds);
        this.rebuildLockTtl = Duration.ofSeconds(rebuildLockTtlSeconds);
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

    @Override
    public RebuildLock tryAcquireRebuildLock(Long id) {
        if (id == null) {
            return RebuildLock.unavailable();
        }

        String token = UUID.randomUUID().toString();
        LocalDateTime expireAt = LocalDateTime.now().plus(rebuildLockTtl);

        while (true) {
            RebuildLockEntry current = rebuildLocks.get(id);

            if (current != null && LocalDateTime.now().isBefore(current.expireAt())) {
                return RebuildLock.busy();
            }

            RebuildLockEntry replacement = new RebuildLockEntry(token, expireAt);
            boolean acquired = current == null
                    ? rebuildLocks.putIfAbsent(id, replacement) == null
                    : rebuildLocks.replace(id, current, replacement);

            if (acquired) {
                return RebuildLock.acquired(token);
            }
        }
    }

    @Override
    public void releaseRebuildLock(Long id, String token) {
        if (id == null || token == null || token.isBlank()) {
            return;
        }

        rebuildLocks.computeIfPresent(id, (key, entry) -> token.equals(entry.token()) ? null : entry);
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

    private record RebuildLockEntry(String token, LocalDateTime expireAt) {
    }
}
