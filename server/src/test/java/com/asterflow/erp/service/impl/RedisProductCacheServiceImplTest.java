package com.asterflow.erp.service.impl;

import com.asterflow.erp.service.ProductCacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RedisProductCacheServiceImplTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private RedisProductCacheServiceImpl cacheService;

    @BeforeEach
    void setUp() {
        cacheService = new RedisProductCacheServiceImpl(
                redisTemplate,
                new ObjectMapper(),
                300,
                30,
                10
        );
    }

    @Test
    void shouldAcquireRebuildLockWithExpiry() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(
                eq("asterflow-erp:product:rebuild-lock:1"),
                anyString(),
                eq(Duration.ofSeconds(10))
        )).thenReturn(true);

        ProductCacheService.RebuildLock lock = cacheService.tryAcquireRebuildLock(1L);

        assertThat(lock.isAcquired()).isTrue();
        assertThat(lock.token()).isNotBlank();
    }

    @Test
    void shouldReportBusyWhenAnotherRequestOwnsRebuildLock() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class)))
                .thenReturn(false);

        assertThat(cacheService.tryAcquireRebuildLock(1L).isBusy()).isTrue();
    }

    @Test
    void shouldBypassLockWhenRedisIsUnavailable() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class)))
                .thenThrow(new IllegalStateException("redis down"));

        assertThat(cacheService.tryAcquireRebuildLock(1L).isUnavailable()).isTrue();
    }

    @Test
    void shouldReleaseRebuildLockWithOwnerToken() {
        cacheService.releaseRebuildLock(1L, "owner-token");

        verify(redisTemplate).execute(
                any(),
                eq(java.util.List.of("asterflow-erp:product:rebuild-lock:1")),
                eq("owner-token")
        );
    }
}
