package com.demo.erp.service;

import com.demo.erp.dto.dashboard.DashboardSummaryResponse;

public interface DashboardCacheService {

    DashboardSummaryResponse getSummary();

    void setSummary(DashboardSummaryResponse summary);

    void evictSummary();

}