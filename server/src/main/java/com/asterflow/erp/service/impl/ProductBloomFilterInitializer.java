package com.asterflow.erp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.asterflow.erp.entity.Product;
import com.asterflow.erp.mapper.ProductMapper;
import com.asterflow.erp.service.ProductBloomFilter;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ProductBloomFilterInitializer implements ApplicationRunner {

    private final ProductMapper productMapper;
    private final ProductBloomFilter productBloomFilter;

    public ProductBloomFilterInitializer(ProductMapper productMapper,
                                         ProductBloomFilter productBloomFilter) {
        this.productMapper = productMapper;
        this.productBloomFilter = productBloomFilter;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<Object> ids = productMapper.selectObjs(new QueryWrapper<Product>().select("id"));

        for (Object id : ids) {
            if (id instanceof Number number) {
                productBloomFilter.put(number.longValue());
            }
        }
    }
}
