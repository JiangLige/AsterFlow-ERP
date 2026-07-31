package com.asterFlow.erp.controller;

import com.asterFlow.erp.common.ApiResponse;
import com.asterFlow.erp.dto.PageResponse;
import com.asterFlow.erp.dto.StockRecordResponse;
import com.asterFlow.erp.service.StockRecordService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/stock-records")
public class StockRecordController {

    private final StockRecordService stockRecordService;

    public StockRecordController(StockRecordService stockRecordService) {
        this.stockRecordService = stockRecordService;
    }

    @GetMapping
    public ApiResponse<PageResponse<StockRecordResponse>> pageList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime startTime,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime endTime,
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "10") long size) {

        return ApiResponse.success(
                stockRecordService.pageList(keyword, type, startTime, endTime, page, size)
        );
    }
}