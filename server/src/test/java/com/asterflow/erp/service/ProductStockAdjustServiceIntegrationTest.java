package com.asterflow.erp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.asterflow.erp.common.BusinessException;
import com.asterflow.erp.dto.StockAdjustRequest;
import com.asterflow.erp.enums.ProductStatus;
import com.asterflow.erp.enums.StockChangeType;
import com.asterflow.erp.mapper.ProductMapper;
import com.asterflow.erp.mapper.StockRecordMapper;
import com.asterflow.erp.entity.Product;
import com.asterflow.erp.entity.StockRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class ProductStockAdjustServiceIntegrationTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private StockRecordMapper stockRecordMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanDatabase() {
        jdbcTemplate.execute("DELETE FROM t_stock_record");
        jdbcTemplate.execute("DELETE FROM t_product");
    }

    @Test
    void manualInboundIncreasesStockAndCreatesStockRecord() {
        Product product = createProduct("P-ADJUST-001", 10);

        StockAdjustRequest request = new StockAdjustRequest();
        request.setType(StockChangeType.IN.name());
        request.setChangeQuantity(5);
        request.setRemark("manual inbound test");

        productService.adjustStock(product.getId(), request);

        Product updatedProduct = productMapper.selectById(product.getId());
        List<StockRecord> records = findRecords(product.getId());

        assertThat(updatedProduct.getStock()).isEqualTo(15);
        assertThat(records).hasSize(1);
        assertThat(records.get(0).getType()).isEqualTo(StockChangeType.IN.name());
        assertThat(records.get(0).getChangeQuantity()).isEqualTo(5);
        assertThat(records.get(0).getBeforeStock()).isEqualTo(10);
        assertThat(records.get(0).getAfterStock()).isEqualTo(15);
        assertThat(records.get(0).getSourceType()).isEqualTo("MANUAL");
        assertThat(records.get(0).getRemark()).isEqualTo("manual inbound test");
    }

    @Test
    void manualOutboundDeductsStockAndCreatesStockRecord() {
        Product product = createProduct("P-ADJUST-002", 10);

        StockAdjustRequest request = new StockAdjustRequest();
        request.setType(StockChangeType.OUT.name());
        request.setChangeQuantity(-3);
        request.setRemark("manual outbound test");

        productService.adjustStock(product.getId(), request);

        Product updatedProduct = productMapper.selectById(product.getId());
        List<StockRecord> records = findRecords(product.getId());

        assertThat(updatedProduct.getStock()).isEqualTo(7);
        assertThat(records).hasSize(1);
        assertThat(records.get(0).getType()).isEqualTo(StockChangeType.OUT.name());
        assertThat(records.get(0).getChangeQuantity()).isEqualTo(-3);
        assertThat(records.get(0).getBeforeStock()).isEqualTo(10);
        assertThat(records.get(0).getAfterStock()).isEqualTo(7);
        assertThat(records.get(0).getSourceType()).isEqualTo("MANUAL");
        assertThat(records.get(0).getRemark()).isEqualTo("manual outbound test");
    }

    @Test
    void manualOutboundRejectsWhenStockIsInsufficient() {
        Product product = createProduct("P-ADJUST-003", 2);

        StockAdjustRequest request = new StockAdjustRequest();
        request.setType(StockChangeType.OUT.name());
        request.setChangeQuantity(-3);
        request.setRemark("insufficient stock test");

        assertThatThrownBy(() -> productService.adjustStock(product.getId(), request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("库存不足");

        Product unchangedProduct = productMapper.selectById(product.getId());
        List<StockRecord> records = findRecords(product.getId());

        assertThat(unchangedProduct.getStock()).isEqualTo(2);
        assertThat(records).isEmpty();
    }

    private Product createProduct(String code, int stock) {
        Product product = new Product();
        product.setProductCode(code);
        product.setName("Test Product " + code);
        product.setCategory("Test Category");
        product.setUnit("pcs");
        product.setPrice(new BigDecimal("20.00"));
        product.setCost(new BigDecimal("10.00"));
        product.setStock(stock);
        product.setStatus(ProductStatus.ACTIVE.name());
        product.setMinStock(0);

        productMapper.insert(product);
        return product;
    }

    private List<StockRecord> findRecords(Long productId) {
        return stockRecordMapper.selectList(
                new LambdaQueryWrapper<StockRecord>()
                        .eq(StockRecord::getProductId, productId)
                        .orderByAsc(StockRecord::getId)
        );
    }
}