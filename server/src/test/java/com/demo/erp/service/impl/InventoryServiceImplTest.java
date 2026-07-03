package com.demo.erp.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.demo.erp.dto.inventory.InventoryChangeCommand;
import com.demo.erp.mapper.ProductMapper;
import com.demo.erp.mapper.StockRecordMapper;
import com.demo.erp.service.DashboardCacheService;
import entity.Product;
import entity.StockRecord;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceImplTest {

    @Mock
    private ProductMapper productMapper;

    @Mock
    private StockRecordMapper stockRecordMapper;

    @Mock
    private DashboardCacheService dashboardCacheService;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    @BeforeAll
    static void initMybatisPlusLambdaCache() {
        TableInfoHelper.initTableInfo(
                new MapperBuilderAssistant(new MybatisConfiguration(), ""),
                Product.class
        );
    }

    @Test
    void outboundUsesDatabaseAtomicDecrementToAvoidLostUpdates() {
        Product product = new Product();
        product.setId(1L);
        product.setProductCode("P-LOCK-001");
        product.setName("Lock Product");
        product.setStock(10);

        Product updatedProduct = new Product();
        updatedProduct.setId(1L);
        updatedProduct.setProductCode("P-LOCK-001");
        updatedProduct.setName("Lock Product");
        updatedProduct.setStock(7);

        when(productMapper.selectById(1L)).thenReturn(product, updatedProduct);
        when(productMapper.update(isNull(), org.mockito.ArgumentMatchers.any())).thenReturn(1);

        inventoryService.outbound(new InventoryChangeCommand(
                1L,
                3,
                "TEST",
                99L,
                "TEST-001",
                "atomic decrement"
        ));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<LambdaUpdateWrapper<Product>> wrapperCaptor =
                ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        ArgumentCaptor<StockRecord> stockRecordCaptor = ArgumentCaptor.forClass(StockRecord.class);

        verify(productMapper).update(isNull(), wrapperCaptor.capture());
        verify(stockRecordMapper).insert(stockRecordCaptor.capture());

        assertThat(wrapperCaptor.getValue().getSqlSet())
                .contains("stock = stock - 3");
        assertThat(stockRecordCaptor.getValue().getBeforeStock()).isEqualTo(10);
        assertThat(stockRecordCaptor.getValue().getAfterStock()).isEqualTo(7);
    }
}
