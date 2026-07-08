package com.asterflow.erp.service.impl;

import com.asterflow.erp.dto.inventory.InventoryChangeCommand;
import com.asterflow.erp.mapper.ProductMapper;
import com.asterflow.erp.mapper.StockRecordMapper;
import com.asterflow.erp.service.DashboardCacheService;
import com.asterflow.erp.entity.Product;
import com.asterflow.erp.entity.StockRecord;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.assertj.core.api.Assertions.assertThat;
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

    @Test
    void outboundUsesMapperAtomicDeductToAvoidOverselling() {
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
        when(productMapper.deductStockIfEnough(1L, 3)).thenReturn(1);

        inventoryService.outbound(new InventoryChangeCommand(
                1L,
                3,
                "TEST",
                99L,
                "TEST-001",
                "atomic decrement"
        ));

        ArgumentCaptor<StockRecord> stockRecordCaptor = ArgumentCaptor.forClass(StockRecord.class);

        verify(productMapper).deductStockIfEnough(1L, 3);
        verify(stockRecordMapper).insert(stockRecordCaptor.capture());

        assertThat(stockRecordCaptor.getValue().getBeforeStock()).isEqualTo(10);
        assertThat(stockRecordCaptor.getValue().getAfterStock()).isEqualTo(7);
    }
}