package com.asterFlow.erp.service;

import com.asterFlow.erp.dto.*;

import java.time.LocalDateTime;
import java.util.List;


public interface ProductService {

    ProductResponse create(ProductRequest request);

    ProductResponse getById(Long id);

    PageResponse<ProductResponse> pageList(String keyword, String status, long page, long size);

    ProductResponse update(Long id, ProductRequest request);

    void inactive(Long id);
    void active(Long id);

    void delete(Long id);

    void adjustStock(Long productId, StockAdjustRequest request);

    List<ProductResponse> warningList();

    PageResponse<StockRecordResponse> pageStockRecords(
            Long productId,
            String type,
            LocalDateTime startTime,
            LocalDateTime endTime,
            long page,
            long size);

}