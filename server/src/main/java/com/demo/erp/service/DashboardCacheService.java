package com.demo.erp.service;

import com.demo.erp.dto.dashboard.DashboardSummaryResponse;
import com.demo.erp.common.EnumValidator;
import com.demo.erp.enums.CustomerStatus;

public interface DashboardCacheService {

    DashboardSummaryResponse getSummary();

    void setSummary(DashboardSummaryResponse summary);

    void evictSummary();

}