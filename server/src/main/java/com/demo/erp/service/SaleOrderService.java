package com.demo.erp.service;

import com.demo.erp.dto.PageResponse;
import com.demo.erp.dto.sale.SaleOrderCreateRequest;
import com.demo.erp.dto.sale.SaleOrderResponse;

public interface SaleOrderService {

    SaleOrderResponse create(SaleOrderCreateRequest request);

    SaleOrderResponse getById(Long id);

    PageResponse<SaleOrderResponse> pageList(String keyword, String status, long page, long size);

    void approve(Long id);

    void delete(Long id);

    SaleOrderResponse update(Long id, SaleOrderCreateRequest request);

    void cancel(Long id);
}