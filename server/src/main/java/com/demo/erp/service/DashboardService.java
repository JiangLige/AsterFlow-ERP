package com.demo.erp.service;

import com.demo.erp.dto.dashboard.DashboardSummaryResponse;
import com.demo.erp.common.EnumValidator;
import com.demo.erp.enums.CustomerStatus;

public interface DashboardService {

    DashboardSummaryResponse summary();
}