package com.asterflow.erp.service.impl;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LocalProductBloomFilterTest {

    @Test
    void shouldReturnFalseBeforeProductIdIsRegistered() {
        LocalProductBloomFilter bloomFilter = new LocalProductBloomFilter();

        assertThat(bloomFilter.mightContain(1L)).isFalse();
    }

    @Test
    void shouldReturnTrueAfterProductIdIsRegistered() {
        LocalProductBloomFilter bloomFilter = new LocalProductBloomFilter();

        bloomFilter.put(1L);

        assertThat(bloomFilter.mightContain(1L)).isTrue();
    }
}
