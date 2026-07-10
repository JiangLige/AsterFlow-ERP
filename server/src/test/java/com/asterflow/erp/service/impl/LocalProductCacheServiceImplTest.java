package com.asterflow.erp.service.impl;

import com.asterflow.erp.dto.ProductResponse;
import com.asterflow.erp.service.ProductCacheService;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LocalProductCacheServiceImplTest {

    @Test
    void shouldReturnCachedProductUntilEvicted() {
        LocalProductCacheServiceImpl cacheService = new LocalProductCacheServiceImpl(300, 30, 10);
        ProductResponse product = new ProductResponse();
        product.setId(1L);
        product.setProductCode("P-CACHE-001");
        product.setName("Cached Product");

        cacheService.setProduct(product);

        assertThat(cacheService.getProduct(1L)).containsSame(product);

        cacheService.evictProduct(1L);

        assertThat(cacheService.getProduct(1L)).isEmpty();
    }

    @Test
    void shouldTrackMissingProductWithShortLivedMarker() {
        LocalProductCacheServiceImpl cacheService = new LocalProductCacheServiceImpl(300, 30, 10);

        cacheService.setMissing(404L);

        assertThat(cacheService.isKnownMissing(404L)).isTrue();
        assertThat(cacheService.getProduct(404L)).isEmpty();

        cacheService.evictProduct(404L);

        assertThat(cacheService.isKnownMissing(404L)).isFalse();
    }

    @Test
    void shouldAllowOnlyLockOwnerToReleaseRebuildLock() {
        LocalProductCacheServiceImpl cacheService = new LocalProductCacheServiceImpl(300, 30, 10);

        ProductCacheService.RebuildLock firstLock = cacheService.tryAcquireRebuildLock(1L);
        ProductCacheService.RebuildLock competingLock = cacheService.tryAcquireRebuildLock(1L);

        assertThat(firstLock.isAcquired()).isTrue();
        assertThat(competingLock.isBusy()).isTrue();

        cacheService.releaseRebuildLock(1L, "wrong-token");
        assertThat(cacheService.tryAcquireRebuildLock(1L).isBusy()).isTrue();

        cacheService.releaseRebuildLock(1L, firstLock.token());
        assertThat(cacheService.tryAcquireRebuildLock(1L).isAcquired()).isTrue();
    }
}
