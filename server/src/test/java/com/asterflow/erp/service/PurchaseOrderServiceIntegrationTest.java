package com.asterflow.erp.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.asterflow.erp.common.BusinessException;
import com.asterflow.erp.dto.PurchaseOrderCreateRequest;
import com.asterflow.erp.dto.PurchaseOrderItemRequest;
import com.asterflow.erp.dto.PurchaseOrderResponse;
import com.asterflow.erp.enums.ProductStatus;
import com.asterflow.erp.enums.PurchaseOrderStatus;
import com.asterflow.erp.enums.StockChangeType;
import com.asterflow.erp.mapper.ProductMapper;
import com.asterflow.erp.mapper.PurchaseOrderMapper;
import com.asterflow.erp.mapper.StockRecordMapper;
import com.asterflow.erp.mapper.SupplierMapper;
import com.asterflow.erp.entity.Product;
import com.asterflow.erp.entity.PurchaseOrder;
import com.asterflow.erp.entity.StockRecord;
import com.asterflow.erp.entity.Supplier;
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
class PurchaseOrderServiceIntegrationTest {

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @Autowired
    private SupplierMapper supplierMapper;

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private PurchaseOrderMapper purchaseOrderMapper;

    @Autowired
    private StockRecordMapper stockRecordMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanDatabase() {
        jdbcTemplate.execute("DELETE FROM t_stock_record");
        jdbcTemplate.execute("DELETE FROM t_purchase_order_item");
        jdbcTemplate.execute("DELETE FROM t_purchase_order");
        jdbcTemplate.execute("DELETE FROM t_order_sequence");
        jdbcTemplate.execute("DELETE FROM t_product");
        jdbcTemplate.execute("DELETE FROM t_supplier");
    }

    @Test
    void approveIncreasesStockAndCreatesInboundRecord() {
        Supplier supplier = createSupplier("SUP-PO-001");
        Product product = createProduct("P-PO-001", 5);
        PurchaseOrderResponse order = createPurchaseOrder(supplier.getId(), product.getId(), 4);

        purchaseOrderService.approve(order.getId());

        Product updatedProduct = productMapper.selectById(product.getId());
        PurchaseOrder updatedOrder = purchaseOrderMapper.selectById(order.getId());
        List<StockRecord> records = stockRecordMapper.selectList(
                new LambdaQueryWrapper<StockRecord>()
                        .eq(StockRecord::getSourceId, order.getId())
                        .eq(StockRecord::getSourceType, "PURCHASE_ORDER")
        );

        assertThat(updatedProduct.getStock()).isEqualTo(9);
        assertThat(updatedOrder.getStatus()).isEqualTo(PurchaseOrderStatus.APPROVED.name());
        assertThat(records).hasSize(1);
        assertThat(records.get(0).getType()).isEqualTo(StockChangeType.IN.name());
        assertThat(records.get(0).getChangeQuantity()).isEqualTo(4);
        assertThat(records.get(0).getBeforeStock()).isEqualTo(5);
        assertThat(records.get(0).getAfterStock()).isEqualTo(9);
    }

    @Test
    void cancelApprovedOrderDeductsStockAndCreatesOutboundRecord() {
        Supplier supplier = createSupplier("SUP-PO-002");
        Product product = createProduct("P-PO-002", 5);
        PurchaseOrderResponse order = createPurchaseOrder(supplier.getId(), product.getId(), 4);
        purchaseOrderService.approve(order.getId());

        purchaseOrderService.cancel(order.getId());

        Product updatedProduct = productMapper.selectById(product.getId());
        PurchaseOrder updatedOrder = purchaseOrderMapper.selectById(order.getId());
        List<StockRecord> records = stockRecordMapper.selectList(
                new LambdaQueryWrapper<StockRecord>()
                        .eq(StockRecord::getSourceId, order.getId())
                        .orderByAsc(StockRecord::getId)
        );

        assertThat(updatedProduct.getStock()).isEqualTo(5);
        assertThat(updatedOrder.getStatus()).isEqualTo(PurchaseOrderStatus.CANCELED.name());
        assertThat(records).hasSize(2);
        assertThat(records.get(1).getSourceType()).isEqualTo("PURCHASE_ORDER_CANCEL");
        assertThat(records.get(1).getType()).isEqualTo(StockChangeType.OUT.name());
        assertThat(records.get(1).getChangeQuantity()).isEqualTo(-4);
        assertThat(records.get(1).getBeforeStock()).isEqualTo(9);
        assertThat(records.get(1).getAfterStock()).isEqualTo(5);
    }

    @Test
    void cancelRollsBackWhenCurrentStockCannotCoverReversal() {
        Supplier supplier = createSupplier("SUP-PO-003");
        Product firstProduct = createProduct("P-PO-003-A", 5);
        Product secondProduct = createProduct("P-PO-003-B", 1);
        PurchaseOrderResponse order = createPurchaseOrder(
                supplier.getId(),
                List.of(
                        item(firstProduct.getId(), 4),
                        item(secondProduct.getId(), 2)
                )
        );
        purchaseOrderService.approve(order.getId());
        updateStock(secondProduct.getId(), 1);

        assertThatThrownBy(() -> purchaseOrderService.cancel(order.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("库存不足");

        Product unchangedFirstProduct = productMapper.selectById(firstProduct.getId());
        Product unchangedSecondProduct = productMapper.selectById(secondProduct.getId());
        PurchaseOrder unchangedOrder = purchaseOrderMapper.selectById(order.getId());
        List<StockRecord> records = stockRecordMapper.selectList(
                new LambdaQueryWrapper<StockRecord>()
                        .eq(StockRecord::getSourceId, order.getId())
                        .orderByAsc(StockRecord::getId)
        );

        assertThat(unchangedFirstProduct.getStock()).isEqualTo(9);
        assertThat(unchangedSecondProduct.getStock()).isEqualTo(1);
        assertThat(unchangedOrder.getStatus()).isEqualTo(PurchaseOrderStatus.APPROVED.name());
        assertThat(records).hasSize(2);
        assertThat(records)
                .extracting(StockRecord::getSourceType)
                .containsOnly("PURCHASE_ORDER");
    }

    private Supplier createSupplier(String code) {
        Supplier supplier = new Supplier();
        supplier.setSupplierCode(code);
        supplier.setName("Test Supplier " + code);
        supplier.setStatus("ACTIVE");

        supplierMapper.insert(supplier);
        return supplier;
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

    private PurchaseOrderResponse createPurchaseOrder(Long supplierId, Long productId, int quantity) {
        return createPurchaseOrder(supplierId, List.of(item(productId, quantity)));
    }

    private PurchaseOrderResponse createPurchaseOrder(Long supplierId, List<PurchaseOrderItemRequest> items) {
        PurchaseOrderCreateRequest request = new PurchaseOrderCreateRequest();
        request.setSupplierId(supplierId);
        request.setRemark("integration test purchase order");
        request.setItems(items);

        return purchaseOrderService.create(request);
    }

    private PurchaseOrderItemRequest item(Long productId, int quantity) {
        PurchaseOrderItemRequest item = new PurchaseOrderItemRequest();
        item.setProductId(productId);
        item.setQuantity(quantity);
        item.setPrice(new BigDecimal("10.00"));
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
