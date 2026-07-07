package com.asterflow.erp.service;

import com.asterflow.erp.dto.CustomerRequest;
import com.asterflow.erp.dto.CustomerResponse;
import com.asterflow.erp.dto.PageResponse;

public interface CustomerService {

    CustomerResponse create(CustomerRequest request);

    CustomerResponse getById(Long id);

    PageResponse<CustomerResponse> pageList(String keyword, String status, long page, long size);

    CustomerResponse update(Long id, CustomerRequest request);

    void delete(Long id);
}