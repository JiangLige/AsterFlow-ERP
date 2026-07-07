package com.asterflow.erp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.asterflow.erp.dto.CustomerRequest;
import com.asterflow.erp.dto.CustomerResponse;
import com.asterflow.erp.dto.PageResponse;
import com.asterflow.erp.common.BusinessException;
import com.asterflow.erp.mapper.CustomerMapper;
import com.asterflow.erp.service.CustomerService;
import entity.Customer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerServiceImpl implements CustomerService {

    private final CustomerMapper customerMapper;

    public CustomerServiceImpl(CustomerMapper customerMapper) {
        this.customerMapper = customerMapper;
    }

    @Override
    @Transactional
    public CustomerResponse create(CustomerRequest request) {
        Long count = customerMapper.selectCount(
                new LambdaQueryWrapper<Customer>()
                        .eq(Customer::getCustomerCode, request.getCustomerCode())
        );

        if (count > 0) {
            throw new BusinessException("客户编码已存");
        }

        Customer customer = new Customer();
        customer.setCustomerCode(request.getCustomerCode());
        customer.setName(request.getName());
        customer.setContactName(request.getContactName());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());
        customer.setStatus("ACTIVE");

        customerMapper.insert(customer);

        return toResponse(customer);
    }

    @Override
    public CustomerResponse getById(Long id) {
        Customer customer = customerMapper.selectById(id);

        if (customer == null) {
            throw new BusinessException("客户不存");
        }

        return toResponse(customer);
    }

    @Override
    public PageResponse<CustomerResponse> pageList(String keyword, String status, long page, long size) {
        LambdaQueryWrapper<Customer> wrapper = new LambdaQueryWrapper<>();

        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w
                    .like(Customer::getCustomerCode, keyword)
                    .or()
                    .like(Customer::getName, keyword)
                    .or()
                    .like(Customer::getPhone, keyword)
            );
        }

        if (status != null && !status.isBlank()) {
            wrapper.eq(Customer::getStatus, status);
        }

        wrapper.orderByDesc(Customer::getCreatedAt);

        Page<Customer> customerPage = new Page<>(page, size);
        Page<Customer> result = customerMapper.selectPage(customerPage, wrapper);

        List<CustomerResponse> records = result.getRecords()
                .stream()
                .map(this::toResponse)
                .toList();

        return new PageResponse<>(
                records,
                result.getTotal(),
                result.getCurrent(),
                result.getSize(),
                result.getPages()
        );
    }

    @Override
    @Transactional
    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer customer = customerMapper.selectById(id);

        if (customer == null) {
            throw new BusinessException("客户不存");
        }

        Long count = customerMapper.selectCount(
                new LambdaQueryWrapper<Customer>()
                        .eq(Customer::getCustomerCode, request.getCustomerCode())
                        .ne(Customer::getId, id)
        );

        if (count > 0) {
            throw new BusinessException("客户编码已存");
        }

        customer.setCustomerCode(request.getCustomerCode());
        customer.setName(request.getName());
        customer.setContactName(request.getContactName());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            customer.setStatus(request.getStatus());
        }

        customerMapper.updateById(customer);

        return toResponse(customer);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Customer customer = customerMapper.selectById(id);

        if (customer == null) {
            throw new BusinessException("客户不存");
        }

        customer.setStatus("INACTIVE");
        customerMapper.updateById(customer);
    }

    private CustomerResponse toResponse(Customer customer) {
        CustomerResponse response = new CustomerResponse();
        response.setId(customer.getId());
        response.setCustomerCode(customer.getCustomerCode());
        response.setName(customer.getName());
        response.setContactName(customer.getContactName());
        response.setPhone(customer.getPhone());
        response.setAddress(customer.getAddress());
        response.setStatus(customer.getStatus());
        response.setCreatedAt(customer.getCreatedAt());
        response.setUpdatedAt(customer.getUpdatedAt());
        return response;
    }
}
