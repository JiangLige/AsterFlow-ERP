package com.asterflow.erp.service;

import com.asterflow.erp.dto.PageResponse;
import com.asterflow.erp.dto.StockRecordResponse;

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