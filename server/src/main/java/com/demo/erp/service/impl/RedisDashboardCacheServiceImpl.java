package com.demo.erp.service.impl;

import com.demo.erp.dto.dashboard.DashboardSummaryResponse;
import com.demo.erp.service.DashboardCacheService;
import tools.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@ConditionalOnProperty(name = "erp.cache.type", havingValue = "redis")
public class RedisDashboardCacheServiceImpl implements DashboardCacheService {

    private static final String KEY = "demo-erp:dashboard:summary";
    private static final Duration TTL = Duration.ofSeconds(60);

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public RedisDashboardCacheServiceImpl(StringRedisTemplate stringRedisTemplate,
                                          ObjectMapper objectMapper) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public DashboardSummaryResponse getSummary() {
        String json = stringRedisTemplate.opsForValue().get(KEY);

        if (json == null || json.isBlank()) {
            return null;
        }

        try {
            return objectMapper.readValue(json, DashboardSummaryResponse.class);
        } catch (Exception e) {
            evictSummary();
            return null;
        }
    }

    @Override
    public void setSummary(DashboardSummaryResponse summary) {
        try {
            String json = objectMapper.writeValueAsString(summary);
            stringRedisTemplate.opsForValue().set(KEY, json, TTL);
        } catch (Exception e) {
            throw new RuntimeException("Dashboard缓存序列化失败", e);
        }
    }

    @Override
    public void evictSummary() {
        stringRedisTemplate.delete(KEY);
    }
}