package com.asterflow.erp.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.asterflow.erp.dto.StockAdjustRequest;
import com.asterflow.erp.enums.ProductStatus;
import com.asterflow.erp.enums.StockChangeType;
import com.asterflow.erp.mapper.AuditLogMapper;
import com.asterflow.erp.mapper.ProductMapper;
import com.asterflow.erp.entity.AuditLog;
import com.asterflow.erp.entity.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ProductControllerAuditLogIntegrationTest {

    @Autowired
    private ProductController productController;

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private AuditLogMapper auditLogMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanDatabase() {
        jdbcTemplate.execute("DELETE FROM t_audit_log");
        jdbcTemplate.execute("DELETE FROM t_stock_record");
        jdbcTemplate.execute("DELETE FROM t_product");
    }

    @Test
    void adjustStockCreatesAuditLog() {
        Product product = createProduct("P-AUDIT-001", 10);

        StockAdjustRequest request = new StockAdjustRequest();
        request.setType(StockChangeType.IN.name());
        request.setChangeQuantity(5);
        request.setRemark("audit test");

        MockHttpServletRequest httpRequest = new MockHttpServletRequest();
        httpRequest.setAttribute("userId", 1L);
        httpRequest.setAttribute("username", "admin");
        httpRequest.setAttribute("role", "ADMIN");

        productController.adjustStock(product.getId(), request, httpRequest);

        List<AuditLog> logs = auditLogMapper.selectList(
                new LambdaQueryWrapper<AuditLog>()
                        .eq(AuditLog::getTargetType, "PRODUCT")
                        .eq(AuditLog::getTargetId, product.getId())
        );

        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getOperatorId()).isEqualTo(1L);
        assertThat(logs.get(0).getOperatorName()).isEqualTo("admin");
        assertThat(logs.get(0).getOperatorRole()).isEqualTo("ADMIN");
        assertThat(logs.get(0).getAction()).isEqualTo("STOCK_ADJUST");
        assertThat(logs.get(0).getTargetNo()).isEqualTo("P-AUDIT-001");
        assertThat(logs.get(0).getDescription()).contains("变化数量");
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
}
