package com.demo.erp.service;

import com.demo.erp.dto.PageResponse;
import com.demo.erp.dto.StockRecordResponse;
import java.time.LocalDateTime;
import com.demo.erp.common.EnumValidator;
import com.demo.erp.enums.CustomerStatus;

public interface StockRecordService {

    PageResponse<StockRecordResponse> pageList(
            String keyword,
            String type,
            LocalDateTime startTime,
            LocalDateTime endTime,
            long page,
            long size);
}