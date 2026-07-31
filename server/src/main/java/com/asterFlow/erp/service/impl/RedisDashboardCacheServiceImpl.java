package com.asterFlow.erp.service.impl;

import com.asterFlow.erp.dto.dashboard.DashboardSummaryResponse;
import com.asterFlow.erp.service.DashboardCacheService;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@ConditionalOnProperty(name = "erp.cache.type", havingValue = "redis")
public class RedisDashboardCacheServiceImpl implements DashboardCacheService {

    private static final Logger log = LoggerFactory.getLogger(RedisDashboardCacheServiceImpl.class);
    private static final String KEY = "asterflow-erp:dashboard:summary";
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
        try {
            String json = stringRedisTemplate.opsForValue().get(KEY);

            if (json == null || json.isBlank()) {
                return null;
            }

            return objectMapper.readValue(json, DashboardSummaryResponse.class);
        } catch (Exception e) {
            log.warn("Dashboard Redis cache read failed, fallback to database", e);
            return null;
        }
    }

    @Override
    public void setSummary(DashboardSummaryResponse summary) {
        try {
            String json = objectMapper.writeValueAsString(summary);
            stringRedisTemplate.opsForValue().set(KEY, json, TTL);
        } catch (Exception e) {
            log.warn("Dashboard Redis cache write failed, ignore and continue", e);
        }
    }

    @Override
    public void evictSummary() {
        try {
            stringRedisTemplate.delete(KEY);
        } catch (Exception e) {
            log.warn("Dashboard Redis cache eviction failed, ignore and continue", e);
        }
    }
}
