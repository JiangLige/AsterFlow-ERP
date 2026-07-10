package com.asterflow.erp.service.impl;

import com.asterflow.erp.mapper.ProductMapper;
import com.asterflow.erp.service.ProductBloomFilter;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProductBloomFilterInitializerTest {

    @Test
    void shouldLoadExistingProductIdsIntoBloomFilterOnStartup() throws Exception {
        ProductMapper productMapper = mock(ProductMapper.class);
        ProductBloomFilter bloomFilter = mock(ProductBloomFilter.class);

        when(productMapper.selectObjs(any())).thenReturn(List.of(1L, 2L, 3L));

        ProductBloomFilterInitializer initializer = new ProductBloomFilterInitializer(productMapper, bloomFilter);

        initializer.run(null);

        verify(bloomFilter).put(1L);
        verify(bloomFilter).put(2L);
        verify(bloomFilter).put(3L);
    }
}
