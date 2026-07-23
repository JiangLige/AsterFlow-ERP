package com.asterFlow.erp.service;

import com.asterFlow.erp.dto.PageResponse;
import com.asterFlow.erp.dto.SupplierRequest;
import com.asterFlow.erp.dto.SupplierResponse;

public interface SupplierService {

    SupplierResponse create(SupplierRequest request);

    SupplierResponse getById(Long id);

    PageResponse<SupplierResponse> pageList(String keyword, String status, long page, long size);

    SupplierResponse update(Long id, SupplierRequest request);

    void active(Long id);

    void inactive(Long id);

    void delete(Long id);
}