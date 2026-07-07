package com.asterflow.erp.service.impl;

import com.asterflow.erp.common.BusinessException;
import com.asterflow.erp.service.IdempotencyService;
import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@ConditionalOnProperty(name = "erp.idempotency.store", havingValue = "local", matchIfMissing = true)
public class LocalIdempotencyServiceImpl implements IdempotencyService {

    private static final long TTL_SECONDS = 600;

    private final Map<String, Instant> keys = new ConcurrentHashMap<>();

    @Override
    public void requireFirstExecution(String scope, String key) {
        if (key == null || key.isBlank()) {
            return;
        }

        cleanupExpiredKeys();

        String mapKey = scope + ":" + key;
        Instant expireAt = Instant.now().plusSeconds(TTL_SECONDS);

        Instant existing = keys.putIfAbsent(mapKey, expireAt);

        if (existing != null && existing.isAfter(Instant.now())) {
            throw new BusinessException("请勿重复提交");
        }
    }

    private void cleanupExpiredKeys() {
        Instant now = Instant.now();
        keys.entrySet().removeIf(entry -> entry.getValue().isBefore(now));
    }
}