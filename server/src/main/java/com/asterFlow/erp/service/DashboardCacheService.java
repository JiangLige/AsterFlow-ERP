package com.asterFlow.erp.service;

import com.asterFlow.erp.dto.dashboard.DashboardSummaryResponse;

public interface DashboardCacheService {

    DashboardSummaryResponse getSummary();

    void setSummary(DashboardSummaryResponse summary);

    void evictSummary();

}