package com.demo.erp.service;

import com.demo.erp.dto.AuditOperator;
import com.demo.erp.dto.PageResponse;
import com.demo.erp.dto.PurchaseOrderCreateRequest;
import com.demo.erp.dto.PurchaseOrderResponse;

public interface PurchaseOrderService {

    PurchaseOrderResponse create(PurchaseOrderCreateRequest request);

    PurchaseOrderResponse getById(Long id);

    PageResponse<PurchaseOrderResponse> pageList(String keyword, String status, long page, long size);

    void approve(Long id);

    void approve(Long id, AuditOperator operator);

    void delete(Long id);

    PurchaseOrderResponse update(Long id, PurchaseOrderCreateRequest request);

    void cancel(Long id);

    void cancel(Long id, AuditOperator operator);
}
