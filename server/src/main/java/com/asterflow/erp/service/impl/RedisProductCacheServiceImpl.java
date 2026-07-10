package com.asterflow.erp.service.impl;

import com.asterflow.erp.dto.ProductResponse;
import com.asterflow.erp.service.ProductCacheService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "erp.cache.type", havingValue = "redis")
public class RedisProductCacheServiceImpl implements ProductCacheService {

    private static final Logger log = LoggerFactory.getLogger(RedisProductCacheServiceImpl.class);
    private static final String KEY_PREFIX = "asterflow-erp:product:detail:";
    private static final String REBUILD_LOCK_KEY_PREFIX = "asterflow-erp:product:rebuild-lock:";
    private static final String MISSING_VALUE = "__MISSING__";

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration detailTtl;
    private final Duration missingTtl;
    private final Duration rebuildLockTtl;
    private final DefaultRedisScript<Long> releaseLockScript;

    public RedisProductCacheServiceImpl(StringRedisTemplate stringRedisTemplate,
                                        ObjectMapper objectMapper,
                                        @Value("${erp.cache.product-detail-ttl-seconds:300}") long detailTtlSeconds,
                                        @Value("${erp.cache.product-missing-ttl-seconds:30}") long missingTtlSeconds,
                                        @Value("${erp.cache.product-rebuild-lock-ttl-seconds:10}") long rebuildLockTtlSeconds) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.objectMapper = objectMapper;
        this.detailTtl = Duration.ofSeconds(detailTtlSeconds);
        this.missingTtl = Duration.ofSeconds(missingTtlSeconds);
        this.rebuildLockTtl = Duration.ofSeconds(rebuildLockTtlSeconds);
        this.releaseLockScript = new DefaultRedisScript<>("""
                if redis.call('GET', KEYS[1]) == ARGV[1] then
                    return redis.call('DEL', KEYS[1])
                end
                return 0
                """, Long.class);
    }

    @Override
    public Optional<ProductResponse> getProduct(Long id) {
        if (id == null) {
            return Optional.empty();
        }

        try {
            String value = stringRedisTemplate.opsForValue().get(key(id));

            if (value == null || value.isBlank() || MISSING_VALUE.equals(value)) {
                return Optional.empty();
            }

            return Optional.of(objectMapper.readValue(value, ProductResponse.class));
        } catch (Exception e) {
            log.warn("Product Redis cache read failed, fallback to database. id={}", id, e);
            return Optional.empty();
        }
    }

    @Override
    public boolean isKnownMissing(Long id) {
        if (id == null) {
            return false;
        }

        try {
            return MISSING_VALUE.equals(stringRedisTemplate.opsForValue().get(key(id)));
        } catch (Exception e) {
            log.warn("Product Redis missing-marker read failed, fallback to database. id={}", id, e);
            return false;
        }
    }

    @Override
    public void setProduct(ProductResponse product) {
        if (product == null || product.getId() == null) {
            return;
        }

        try {
            stringRedisTemplate.opsForValue()
                    .set(key(product.getId()), objectMapper.writeValueAsString(product), detailTtl);
        } catch (Exception e) {
            log.warn("Product Redis cache write failed, ignore and continue. id={}", product.getId(), e);
        }
    }

    @Override
    public void setMissing(Long id) {
        if (id == null) {
            return;
        }

        try {
            stringRedisTemplate.opsForValue().set(key(id), MISSING_VALUE, missingTtl);
        } catch (Exception e) {
            log.warn("Product Redis missing-marker write failed, ignore and continue. id={}", id, e);
        }
    }

    @Override
    public void evictProduct(Long id) {
        if (id == null) {
            return;
        }

        try {
            stringRedisTemplate.delete(key(id));
        } catch (Exception e) {
            log.warn("Product Redis cache eviction failed, ignore and continue. id={}", id, e);
        }
    }

    @Override
    public RebuildLock tryAcquireRebuildLock(Long id) {
        if (id == null) {
            return RebuildLock.unavailable();
        }

        String token = UUID.randomUUID().toString();

        try {
            Boolean acquired = stringRedisTemplate.opsForValue()
                    .setIfAbsent(rebuildLockKey(id), token, rebuildLockTtl);

            if (Boolean.TRUE.equals(acquired)) {
                return RebuildLock.acquired(token);
            }

            return acquired == null ? RebuildLock.unavailable() : RebuildLock.busy();
        } catch (Exception e) {
            log.warn("Product Redis rebuild lock failed, fallback to database. id={}", id, e);
            return RebuildLock.unavailable();
        }
    }

    @Override
    public void releaseRebuildLock(Long id, String token) {
        if (id == null || token == null || token.isBlank()) {
            return;
        }

        try {
            stringRedisTemplate.execute(releaseLockScript, List.of(rebuildLockKey(id)), token);
        } catch (Exception e) {
            log.warn("Product Redis rebuild lock release failed, rely on TTL. id={}", id, e);
        }
    }

    private String key(Long id) {
        return KEY_PREFIX + id;
    }

    private String rebuildLockKey(Long id) {
        return REBUILD_LOCK_KEY_PREFIX + id;
    }
}
