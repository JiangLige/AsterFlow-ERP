package com.asterflow.erp.service;

import com.asterflow.erp.dto.dashboard.DashboardSummaryResponse;

public interface DashboardCacheService {

    DashboardSummaryResponse getSummary();

    void setSummary(DashboardSummaryResponse summary);

    void evictSummary();

}