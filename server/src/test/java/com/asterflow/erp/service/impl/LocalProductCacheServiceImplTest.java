package com.asterflow.erp.service.impl;

import com.asterflow.erp.dto.ProductResponse;
import com.asterflow.erp.service.ProductCacheService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import static org.assertj.core.api.Assertions.assertThat;

class LocalProductCacheServiceImplTest {

    @AfterEach
    void clearSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
        TransactionSynchronizationManager.setActualTransactionActive(false);
    }

    @Test
    void shouldReturnCachedProductUntilEvicted() {
        LocalProductCacheServiceImpl cacheService = cacheService();
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
        LocalProductCacheServiceImpl cacheService = cacheService();

        cacheService.setMissing(404L);

        assertThat(cacheService.isKnownMissing(404L)).isTrue();
        assertThat(cacheService.getProduct(404L)).isEmpty();

        cacheService.evictProduct(404L);

        assertThat(cacheService.isKnownMissing(404L)).isFalse();
    }

    @Test
    void shouldAllowOnlyLockOwnerToReleaseRebuildLock() {
        LocalProductCacheServiceImpl cacheService = cacheService();

        ProductCacheService.RebuildLock firstLock = cacheService.tryAcquireRebuildLock(1L);
        ProductCacheService.RebuildLock competingLock = cacheService.tryAcquireRebuildLock(1L);

        assertThat(firstLock.isAcquired()).isTrue();
        assertThat(competingLock.isBusy()).isTrue();

        cacheService.releaseRebuildLock(1L, "wrong-token");
        assertThat(cacheService.tryAcquireRebuildLock(1L).isBusy()).isTrue();

        cacheService.releaseRebuildLock(1L, firstLock.token());
        assertThat(cacheService.tryAcquireRebuildLock(1L).isAcquired()).isTrue();
    }

    @Test
    void shouldEvictProductOnlyAfterTransactionCommit() {
        LocalProductCacheServiceImpl cacheService = cacheService();
        ProductResponse product = product(2L);
        cacheService.setProduct(product);
        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);

        cacheService.evictProduct(2L);

        assertThat(cacheService.getProduct(2L)).containsSame(product);
        TransactionSynchronizationManager.getSynchronizations()
                .forEach(TransactionSynchronization::afterCommit);
        assertThat(cacheService.getProduct(2L)).isEmpty();
    }

    @Test
    void shouldKeepProductCacheWhenTransactionRollsBack() {
        LocalProductCacheServiceImpl cacheService = cacheService();
        ProductResponse product = product(3L);
        cacheService.setProduct(product);
        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);

        cacheService.evictProduct(3L);
        TransactionSynchronizationManager.getSynchronizations()
                .forEach(synchronization -> synchronization.afterCompletion(
                        TransactionSynchronization.STATUS_ROLLED_BACK
                ));

        assertThat(cacheService.getProduct(3L)).containsSame(product);
    }

    private ProductResponse product(Long id) {
        ProductResponse product = new ProductResponse();
        product.setId(id);
        product.setProductCode("P-CACHE-" + id);
        return product;
    }

    private LocalProductCacheServiceImpl cacheService() {
        return new LocalProductCacheServiceImpl(300, 30, 10, new TransactionAfterCommitExecutor());
    }
}
