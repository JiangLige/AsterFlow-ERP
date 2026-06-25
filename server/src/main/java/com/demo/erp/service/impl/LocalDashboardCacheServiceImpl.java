package com.demo.erp.service.impl;

import com.demo.erp.dto.dashboard.DashboardSummaryResponse;
import com.demo.erp.service.DashboardCacheService;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class LocalDashboardCacheServiceImpl implements DashboardCacheService {

    private static final Duration TTL = Duration.ofSeconds(60);

    private DashboardSummaryResponse cachedSummary;
    private LocalDateTime expireAt;

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
        this.expireAt = LocalDateTime.now().plus(TTL);
    }

    @Override
    public void evictSummary() {
        this.cachedSummary = null;
        this.expireAt = null;
    }
}