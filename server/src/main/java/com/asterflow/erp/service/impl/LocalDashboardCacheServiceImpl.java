package com.asterflow.erp.service.impl;

import com.asterflow.erp.dto.dashboard.DashboardSummaryResponse;
import com.asterflow.erp.service.DashboardCacheService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
@ConditionalOnProperty(name = "erp.cache.type", havingValue = "local", matchIfMissing = true)
public class LocalDashboardCacheServiceImpl implements DashboardCacheService {

    private final Duration ttl;

    private DashboardSummaryResponse cachedSummary;
    private LocalDateTime expireAt;

    public LocalDashboardCacheServiceImpl(
            @Value("${erp.cache.dashboard-summary-ttl-seconds:60}") long ttlSeconds
    ) {
        this.ttl = Duration.ofSeconds(ttlSeconds);
    }

    @Override
    public DashboardSummaryResponse getSummary() {
        if (cachedSummary == null || expireAt == null) {
            return null;
        }

        if (LocalDateTime.now().isAfter(expireAt)) {
            evictSummary();
            return null;
        }

        return cachedSummary;
    }

    @Override
    public void setSummary(DashboardSummaryResponse summary) {
        this.cachedSummary = summary;
        this.expireAt = LocalDateTime.now().plus(ttl);
    }

    @Override
    public void evictSummary() {
        this.cachedSummary = null;
        this.expireAt = null;
    }
}