package com.asterflow.erp.service;

import com.asterflow.erp.dto.PageResponse;
import com.asterflow.erp.dto.PurchaseOrderCreateRequest;
import com.asterflow.erp.dto.PurchaseOrderResponse;

public interface PurchaseOrderService {

    PurchaseOrderResponse create(PurchaseOrderCreateRequest request);

    PurchaseOrderResponse getById(Long id);

    PageResponse<PurchaseOrderResponse> pageList(String keyword, String status, long page, long size);

    void approve(Long id);

    void delete(Long id);

    PurchaseOrderResponse update(Long id, PurchaseOrderCreateRequest request);

    void cancel(Long id);
}