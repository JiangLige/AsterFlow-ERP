package com.asterflow.erp.service.impl;

import com.asterflow.erp.common.BusinessException;
import com.asterflow.erp.dto.ProductRequest;
import com.asterflow.erp.dto.ProductResponse;
import com.asterflow.erp.entity.Product;
import com.asterflow.erp.mapper.ProductMapper;
import com.asterflow.erp.mapper.StockRecordMapper;
import com.asterflow.erp.service.DashboardCacheService;
import com.asterflow.erp.service.InventoryService;
import com.asterflow.erp.service.ProductBloomFilter;
import com.asterflow.erp.service.ProductCacheService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
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

    @Mock
    private ProductBloomFilter productBloomFilter;

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
    void getByIdUsesBloomFilterMissWithoutQueryingDatabase() {
        when(productCacheService.getProduct(999L)).thenReturn(Optional.empty());
        when(productBloomFilter.mightContain(999L)).thenReturn(false);

        ProductServiceImpl productService = productService();

        assertThatThrownBy(() -> productService.getById(999L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("商品不存在");

        verify(productMapper, never()).selectById(999L);
        verify(productCacheService).setMissing(999L);
    }

    @Test
    void createAddsNewProductIdToBloomFilter() {
        ProductRequest request = new ProductRequest();
        request.setProductCode("P-BLOOM-001");
        request.setName("Bloom Product");
        request.setCategory("Office");
        request.setUnit("pcs");
        request.setPrice(BigDecimal.TEN);
        request.setCost(BigDecimal.ONE);
        request.setStock(10);

        when(productMapper.selectCount(any())).thenReturn(0L);
        doAnswer(invocation -> {
            Product product = invocation.getArgument(0);
            product.setId(10L);
            return 1;
        }).when(productMapper).insert(any(Product.class));

        ProductResponse response = productService().create(request);

        assertThat(response.getId()).isEqualTo(10L);
        verify(productBloomFilter).put(10L);
        verify(productCacheService).evictProduct(10L);
        verify(productCacheService, never()).setProduct(any());
    }

    @Test
    void getByIdCachesDatabaseResult() {
        Product product = new Product();
        product.setId(2L);
        product.setProductCode("P-CACHE-002");
        product.setName("Database Product");

        when(productCacheService.getProduct(2L)).thenReturn(Optional.empty());
        when(productBloomFilter.mightContain(2L)).thenReturn(true);
        when(productCacheService.tryAcquireRebuildLock(2L))
                .thenReturn(ProductCacheService.RebuildLock.acquired("lock-token"));
        when(productMapper.selectById(2L)).thenReturn(product);

        ProductServiceImpl productService = productService();
        ProductResponse response = productService.getById(2L);

        assertThat(response.getProductCode()).isEqualTo("P-CACHE-002");
        verify(productCacheService).setProduct(response);
        verify(productCacheService).releaseRebuildLock(2L, "lock-token");
    }

    @Test
    void getByIdWaitsForConcurrentRebuildInsteadOfQueryingDatabase() {
        ProductResponse rebuiltProduct = new ProductResponse();
        rebuiltProduct.setId(3L);
        rebuiltProduct.setProductCode("P-CACHE-003");

        when(productCacheService.getProduct(3L))
                .thenReturn(Optional.empty(), Optional.of(rebuiltProduct));
        when(productBloomFilter.mightContain(3L)).thenReturn(true);
        when(productCacheService.tryAcquireRebuildLock(3L))
                .thenReturn(ProductCacheService.RebuildLock.busy());

        ProductResponse response = productService().getById(3L);

        assertThat(response).isSameAs(rebuiltProduct);
        verify(productMapper, never()).selectById(3L);
    }

    @Test
    void getByIdFallsBackToDatabaseWhenRebuildLockIsUnavailable() {
        Product product = new Product();
        product.setId(4L);
        product.setProductCode("P-CACHE-004");

        when(productCacheService.getProduct(4L)).thenReturn(Optional.empty());
        when(productBloomFilter.mightContain(4L)).thenReturn(true);
        when(productCacheService.tryAcquireRebuildLock(4L))
                .thenReturn(ProductCacheService.RebuildLock.unavailable());
        when(productMapper.selectById(4L)).thenReturn(product);

        ProductResponse response = productService().getById(4L);

        assertThat(response.getProductCode()).isEqualTo("P-CACHE-004");
        verify(productMapper).selectById(4L);
        verify(productCacheService, never()).releaseRebuildLock(any(), any());
    }

    @Test
    void getByIdReleasesRebuildLockWhenDatabaseReadFails() {
        when(productCacheService.getProduct(5L)).thenReturn(Optional.empty());
        when(productBloomFilter.mightContain(5L)).thenReturn(true);
        when(productCacheService.tryAcquireRebuildLock(5L))
                .thenReturn(ProductCacheService.RebuildLock.acquired("lock-token"));
        when(productMapper.selectById(5L)).thenThrow(new IllegalStateException("database down"));

        assertThatThrownBy(() -> productService().getById(5L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("database down");

        verify(productCacheService).releaseRebuildLock(5L, "lock-token");
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
        when(productBloomFilter.mightContain(404L)).thenReturn(true);
        when(productCacheService.tryAcquireRebuildLock(404L))
                .thenReturn(ProductCacheService.RebuildLock.acquired("lock-token"));
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
                productCacheService,
                productBloomFilter,
                new TransactionAfterCommitExecutor(),
                5,
                1
        );
    }
}
