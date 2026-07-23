package com.asterFlow.erp.service;

import com.asterFlow.erp.dto.PageResponse;
import com.asterFlow.erp.dto.PurchaseOrderCreateRequest;
import com.asterFlow.erp.dto.PurchaseOrderResponse;

public interface PurchaseOrderService {

    PurchaseOrderResponse create(PurchaseOrderCreateRequest request);

    PurchaseOrderResponse getById(Long id);

    PageResponse<PurchaseOrderResponse> pageList(String keyword, String status, long page, long size);

    void approve(Long id);

    void delete(Long id);

    PurchaseOrderResponse update(Long id, PurchaseOrderCreateRequest request);

    void cancel(Long id);
}