package com.demo.erp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.erp.common.EnumValidator;
import com.demo.erp.dto.CustomerRequest;
import com.demo.erp.dto.CustomerResponse;
import com.demo.erp.dto.PageResponse;
import com.demo.erp.common.BusinessException;
import com.demo.erp.enums.CustomerStatus;
import com.demo.erp.mapper.CustomerMapper;
import com.demo.erp.service.CustomerService;
import entity.Customer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.demo.erp.common.PageRequestUtil;
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
            throw new BusinessException("客户编码已存在");
        }

        Customer customer = new Customer();
        customer.setCustomerCode(request.getCustomerCode());
        customer.setName(request.getName());
        customer.setContactName(request.getContactName());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());
        customer.setStatus(CustomerStatus.ACTIVE.name());

        customerMapper.insert(customer);

        return toResponse(customer);
    }

    @Override
    public CustomerResponse getById(Long id) {
        Customer customer = customerMapper.selectById(id);

        if (customer == null) {
            throw new BusinessException("客户不存在");
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

        String validStatus = EnumValidator.requireValid(
                CustomerStatus.class,
                status,
                "客户状态不合法"
        );

        if (validStatus != null && !validStatus.isBlank()) {
            wrapper.eq(Customer::getStatus, validStatus);
        }

        wrapper.orderByDesc(Customer::getCreatedAt);

        Page<Customer> customerPage = new Page<>(
                PageRequestUtil.normalizePage(page),
                PageRequestUtil.normalizeSize(size)
        );
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
            throw new BusinessException("客户不存在");
        }

        Long count = customerMapper.selectCount(
                new LambdaQueryWrapper<Customer>()
                        .eq(Customer::getCustomerCode, request.getCustomerCode())
                        .ne(Customer::getId, id)
        );

        if (count > 0) {
            throw new BusinessException("客户编码已存在");
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
            throw new BusinessException("客户不存在");
        }

        customer.setStatus(CustomerStatus.INACTIVE.name());
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
