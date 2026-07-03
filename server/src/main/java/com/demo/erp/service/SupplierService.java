package com.demo.erp.service;

import com.demo.erp.dto.PageResponse;
import com.demo.erp.dto.SupplierRequest;
import com.demo.erp.dto.SupplierResponse;
import com.demo.erp.common.EnumValidator;
import com.demo.erp.enums.CustomerStatus;

public interface SupplierService {

    SupplierResponse create(SupplierRequest request);

    SupplierResponse getById(Long id);

    PageResponse<SupplierResponse> pageList(String keyword, String status, long page, long size);

    SupplierResponse update(Long id, SupplierRequest request);

    void active(Long id);

    void inactive(Long id);

    void delete(Long id);
}