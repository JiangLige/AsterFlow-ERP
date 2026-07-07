package com.asterflow.erp.service.impl;

import com.asterflow.erp.dto.dashboard.DashboardSummaryResponse;
import com.asterflow.erp.service.DashboardCacheService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;

@Service
@ConditionalOnProperty(name = "erp.cache.type", havingValue = "redis")
public class RedisDashboardCacheServiceImpl implements DashboardCacheService {

    private static final Logger log = LoggerFactory.getLogger(RedisDashboardCacheServiceImpl.class);
    private static final String KEY = "asterflow-erp:dashboard:summary";

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration ttl;

    public RedisDashboardCacheServiceImpl(StringRedisTemplate stringRedisTemplate,
                                          ObjectMapper objectMapper,
                                          @Value("${erp.cache.dashboard-summary-ttl-seconds:60}") long ttlSeconds) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.objectMapper = objectMapper;
        this.ttl = Duration.ofSeconds(ttlSeconds);
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
            stringRedisTemplate.opsForValue().set(KEY, json, ttl);
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