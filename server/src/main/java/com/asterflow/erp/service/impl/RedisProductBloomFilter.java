package com.asterflow.erp.service.impl;

import com.asterflow.erp.service.ProductBloomFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
@ConditionalOnProperty(name = "erp.cache.type", havingValue = "redis")
public class RedisProductBloomFilter implements ProductBloomFilter {

    private static final Logger log = LoggerFactory.getLogger(RedisProductBloomFilter.class);
    private static final String DEFAULT_KEY = "asterflow-erp:bloom:product";

    private final StringRedisTemplate stringRedisTemplate;
    private final String key;
    private final int bitSize;

    public RedisProductBloomFilter(StringRedisTemplate stringRedisTemplate,
                                   @Value("${erp.cache.product-bloom-key:" + DEFAULT_KEY + "}") String key,
                                   @Value("${erp.cache.product-bloom-bits:1000000}") int bitSize) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.key = key;
        this.bitSize = bitSize;
    }

    @Override
    public boolean mightContain(Long productId) {
        if (productId == null) {
            return false;
        }

        try {
            for (int offset : offsets(productId)) {
                Boolean hit = stringRedisTemplate.opsForValue().getBit(key, offset);

                if (!Boolean.TRUE.equals(hit)) {
                    return false;
                }
            }

            return true;
        } catch (Exception e) {
            log.warn("Product Redis bloom filter read failed, fallback to database. id={}", productId, e);
            return true;
        }
    }

    @Override
    public void put(Long productId) {
        if (productId == null) {
            return;
        }

        try {
            for (int offset : offsets(productId)) {
                stringRedisTemplate.opsForValue().setBit(key, offset, true);
            }
        } catch (Exception e) {
            log.warn("Product Redis bloom filter write failed, ignore and continue. id={}", productId, e);
        }
    }

    private int[] offsets(Long productId) {
        String value = String.valueOf(productId);

        return new int[]{
                hash(value, "MD5"),
                hash(value, "SHA-1"),
                hash(value, "SHA-256")
        };
    }

    private int hash(String value, String algorithm) {
        try {
            MessageDigest digest = MessageDigest.getInstance(algorithm);
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            int hash = 0;

            for (int i = 0; i < 4; i++) {
                hash = (hash << 8) | (bytes[i] & 0xff);
            }

            return Math.floorMod(hash, bitSize);
        } catch (Exception e) {
            throw new IllegalStateException("Bloom filter hash failed", e);
        }
    }
}
