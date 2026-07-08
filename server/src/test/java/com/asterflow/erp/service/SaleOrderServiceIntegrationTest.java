package com.asterflow.erp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.asterflow.erp.common.BusinessException;
import com.asterflow.erp.dto.sale.SaleOrderCreateRequest;
import com.asterflow.erp.dto.sale.SaleOrderItemRequest;
import com.asterflow.erp.dto.sale.SaleOrderResponse;
import com.asterflow.erp.enums.ProductStatus;
import com.asterflow.erp.enums.SaleOrderStatus;
import com.asterflow.erp.enums.StockChangeType;
import com.asterflow.erp.mapper.CustomerMapper;
import com.asterflow.erp.mapper.ProductMapper;
import com.asterflow.erp.mapper.SaleOrderMapper;
import com.asterflow.erp.mapper.StockRecordMapper;
import com.asterflow.erp.entity.Customer;
import com.asterflow.erp.entity.Product;
import com.asterflow.erp.entity.SaleOrder;
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
class SaleOrderServiceIntegrationTest {

    @Autowired
    private SaleOrderService saleOrderService;

    @Autowired
    private CustomerMapper customerMapper;

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private SaleOrderMapper saleOrderMapper;

    @Autowired
    private StockRecordMapper stockRecordMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanDatabase() {
        jdbcTemplate.execute("DELETE FROM t_stock_record");
        jdbcTemplate.execute("DELETE FROM t_sale_order_item");
        jdbcTemplate.execute("DELETE FROM t_sale_order");
        jdbcTemplate.execute("DELETE FROM t_order_sequence");
        jdbcTemplate.execute("DELETE FROM t_product");
        jdbcTemplate.execute("DELETE FROM t_customer");
    }

    @Test
    void approveDeductsStockAndCreatesOutboundRecord() {
        Customer customer = createCustomer("CUS-SALE-001");
        Product product = createProduct("P-SALE-001", 10);
        SaleOrderResponse order = createSaleOrder(customer.getId(), product.getId(), 3);

        saleOrderService.approve(order.getId());

        Product updatedProduct = productMapper.selectById(product.getId());
        SaleOrder updatedOrder = saleOrderMapper.selectById(order.getId());
        List<StockRecord> records = stockRecordMapper.selectList(
                new LambdaQueryWrapper<StockRecord>()
                        .eq(StockRecord::getSourceId, order.getId())
                        .eq(StockRecord::getSourceType, "SALE_ORDER")
        );

        assertThat(updatedProduct.getStock()).isEqualTo(7);
        assertThat(updatedOrder.getStatus()).isEqualTo(SaleOrderStatus.APPROVED.name());
        assertThat(records).hasSize(1);
        assertThat(records.get(0).getType()).isEqualTo(StockChangeType.OUT.name());
        assertThat(records.get(0).getChangeQuantity()).isEqualTo(-3);
        assertThat(records.get(0).getBeforeStock()).isEqualTo(10);
        assertThat(records.get(0).getAfterStock()).isEqualTo(7);
    }

    @Test
    void cancelApprovedOrderRestoresStockAndCreatesInboundRecord() {
        Customer customer = createCustomer("CUS-SALE-002");
        Product product = createProduct("P-SALE-002", 10);
        SaleOrderResponse order = createSaleOrder(customer.getId(), product.getId(), 3);
        saleOrderService.approve(order.getId());

        saleOrderService.cancel(order.getId());

        Product updatedProduct = productMapper.selectById(product.getId());
        SaleOrder updatedOrder = saleOrderMapper.selectById(order.getId());
        List<StockRecord> records = stockRecordMapper.selectList(
                new LambdaQueryWrapper<StockRecord>()
                        .eq(StockRecord::getSourceId, order.getId())
                        .orderByAsc(StockRecord::getId)
        );

        assertThat(updatedProduct.getStock()).isEqualTo(10);
        assertThat(updatedOrder.getStatus()).isEqualTo(SaleOrderStatus.CANCELED.name());
        assertThat(records).hasSize(2);
        assertThat(records.get(1).getSourceType()).isEqualTo("SALE_ORDER_CANCEL");
        assertThat(records.get(1).getType()).isEqualTo(StockChangeType.IN.name());
        assertThat(records.get(1).getChangeQuantity()).isEqualTo(3);
        assertThat(records.get(1).getBeforeStock()).isEqualTo(7);
        assertThat(records.get(1).getAfterStock()).isEqualTo(10);
    }

    @Test
    void approveRollsBackWhenAnyItemHasInsufficientStock() {
        Customer customer = createCustomer("CUS-SALE-003");
        Product firstProduct = createProduct("P-SALE-003-A", 10);
        Product secondProduct = createProduct("P-SALE-003-B", 1);
        SaleOrderResponse order = createSaleOrder(
                customer.getId(),
                List.of(
                        item(firstProduct.getId(), 3),
                        item(secondProduct.getId(), 1)
                )
        );
        updateStock(secondProduct.getId(), 0);

        assertThatThrownBy(() -> saleOrderService.approve(order.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("库存不足");

        Product unchangedFirstProduct = productMapper.selectById(firstProduct.getId());
        Product unchangedSecondProduct = productMapper.selectById(secondProduct.getId());
        SaleOrder unchangedOrder = saleOrderMapper.selectById(order.getId());
        List<StockRecord> records = stockRecordMapper.selectList(
                new LambdaQueryWrapper<StockRecord>()
                        .eq(StockRecord::getSourceId, order.getId())
        );

        assertThat(unchangedFirstProduct.getStock()).isEqualTo(10);
        assertThat(unchangedSecondProduct.getStock()).isEqualTo(0);
        assertThat(unchangedOrder.getStatus()).isEqualTo(SaleOrderStatus.DRAFT.name());
        assertThat(records).isEmpty();
    }

    private Customer createCustomer(String code) {
        Customer customer = new Customer();
        customer.setCustomerCode(code);
        customer.setName("Test Customer " + code);
        customer.setStatus("ACTIVE");

        customerMapper.insert(customer);
        return customer;
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

    private SaleOrderResponse createSaleOrder(Long customerId, Long productId, int quantity) {
        return createSaleOrder(customerId, List.of(item(productId, quantity)));
    }

    private SaleOrderResponse createSaleOrder(Long customerId, List<SaleOrderItemRequest> items) {
        SaleOrderCreateRequest request = new SaleOrderCreateRequest();
        request.setCustomerId(customerId);
        request.setRemark("integration test order");
        request.setItems(items);

        return saleOrderService.create(request);
    }

    private SaleOrderItemRequest item(Long productId, int quantity) {
        SaleOrderItemRequest item = new SaleOrderItemRequest();
        item.setProductId(productId);
        item.setQuantity(quantity);
        item.setPrice(new BigDecimal("20.00"));
        return item;
    }

    private void updateStock(Long productId, int stock) {
        productMapper.update(
                null,
                new LambdaUpdateWrapper<Product>()
                        .eq(Product::getId, productId)
                        .set(Product::getStock, stock)
        );
    }
}
