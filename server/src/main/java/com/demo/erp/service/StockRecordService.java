package com.demo.erp.service;

import com.demo.erp.dto.PageResponse;
import com.demo.erp.dto.StockRecordResponse;

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