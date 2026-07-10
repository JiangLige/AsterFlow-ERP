package com.asterflow.erp.service.impl;

import com.asterflow.erp.common.BusinessException;
import com.asterflow.erp.dto.ProductResponse;
import com.asterflow.erp.entity.Product;
import com.asterflow.erp.mapper.ProductMapper;
import com.asterflow.erp.mapper.StockRecordMapper;
import com.asterflow.erp.service.DashboardCacheService;
import com.asterflow.erp.service.InventoryService;
import com.asterflow.erp.service.ProductCacheService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductMapper productMapper;

    @Mock
    private StockRecordMapper stockRecordMapper;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private DashboardCacheService dashboardCacheService;

    @Mock
    private ProductCacheService productCacheService;

    @Test
    void getByIdReturnsCachedProductWithoutQueryingDatabase() {
        ProductResponse cachedProduct = new ProductResponse();
        cachedProduct.setId(1L);
        cachedProduct.setProductCode("P-CACHE-001");

        when(productCacheService.getProduct(1L)).thenReturn(Optional.of(cachedProduct));

        ProductServiceImpl productService = productService();

        assertThat(productService.getById(1L)).isSameAs(cachedProduct);
        verify(productMapper, never()).selectById(1L);
    }

    @Test
    void getByIdCachesDatabaseResult() {
        Product product = new Product();
        product.setId(2L);
        product.setProductCode("P-CACHE-002");
        product.setName("Database Product");

        when(productCacheService.getProduct(2L)).thenReturn(Optional.empty());
        when(productMapper.selectById(2L)).thenReturn(product);

        ProductServiceImpl productService = productService();
        ProductResponse response = productService.getById(2L);

        assertThat(response.getProductCode()).isEqualTo("P-CACHE-002");
        verify(productCacheService).setProduct(response);
    }

    @Test
    void getByIdUsesMissingMarkerWithoutQueryingDatabase() {
        when(productCacheService.isKnownMissing(404L)).thenReturn(true);

        ProductServiceImpl productService = productService();

        assertThatThrownBy(() -> productService.getById(404L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("商品不存在");

        verify(productMapper, never()).selectById(404L);
    }

    @Test
    void getByIdCachesMissingMarkerWhenDatabaseMisses() {
        when(productCacheService.getProduct(404L)).thenReturn(Optional.empty());
        when(productMapper.selectById(404L)).thenReturn(null);

        ProductServiceImpl productService = productService();

        assertThatThrownBy(() -> productService.getById(404L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("商品不存在");

        verify(productCacheService).setMissing(404L);
    }

    private ProductServiceImpl productService() {
        return new ProductServiceImpl(
                productMapper,
                stockRecordMapper,
                inventoryService,
                dashboardCacheService,
                productCacheService
        );
    }
}
