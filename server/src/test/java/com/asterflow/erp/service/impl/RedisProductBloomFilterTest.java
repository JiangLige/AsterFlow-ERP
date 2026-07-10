package com.asterflow.erp.service.impl;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RedisProductBloomFilterTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Test
    void shouldReturnFalseWhenAnyBloomBitIsMissing() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.getBit(eq("product-bloom"), anyLong())).thenReturn(false);

        RedisProductBloomFilter bloomFilter = new RedisProductBloomFilter(redisTemplate, "product-bloom", 1_000);

        assertThat(bloomFilter.mightContain(1L)).isFalse();
    }

    @Test
    void shouldSetThreeBloomBitsForProductId() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        RedisProductBloomFilter bloomFilter = new RedisProductBloomFilter(redisTemplate, "product-bloom", 1_000);

        bloomFilter.put(1L);

        verify(valueOperations, times(3)).setBit(eq("product-bloom"), anyLong(), eq(true));
    }

    @Test
    void shouldFallbackToDatabaseWhenRedisReadFails() {
        when(redisTemplate.opsForValue()).thenThrow(new RuntimeException("redis down"));

        RedisProductBloomFilter bloomFilter = new RedisProductBloomFilter(redisTemplate, "product-bloom", 1_000);

        assertThat(bloomFilter.mightContain(1L)).isTrue();
    }
}
