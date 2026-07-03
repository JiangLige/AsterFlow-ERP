package com.demo.erp.service.impl;

import com.demo.erp.common.BusinessException;
import com.demo.erp.service.IdempotencyService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.time.Duration;

@Service
@ConditionalOnProperty(name = "erp.idempotency.store", havingValue = "redis")
public class RedisIdempotencyServiceImpl implements IdempotencyService {

    private static final String KEY_PREFIX = "asterflow-erp:idempotency:";
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(10);

    private final StringRedisTemplate stringRedisTemplate;

    public RedisIdempotencyServiceImpl(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @Override
    public void requireFirstExecution(String scope, String key) {
        if (key == null || key.isBlank()) {
            return;
        }

        String redisKey = KEY_PREFIX + scope + ":" + key;

        Boolean success = stringRedisTemplate.opsForValue()
                .setIfAbsent(redisKey, "1", DEFAULT_TTL);

        if (!Boolean.TRUE.equals(success)) {
            throw new BusinessException("请勿重复提交");
        }
    }
}