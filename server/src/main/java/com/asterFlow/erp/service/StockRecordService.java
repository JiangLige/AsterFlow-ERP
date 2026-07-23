package com.asterFlow.erp.service;

import com.asterFlow.erp.dto.PageResponse;
import com.asterFlow.erp.dto.StockRecordResponse;

import java.time.LocalDateTime;

public interface StockRecordService {

    PageResponse<StockRecordResponse> pageList(
            String keyword,
            String type,
            LocalDateTime startTime,
            LocalDateTime endTime,
            long page,
            long size);
}