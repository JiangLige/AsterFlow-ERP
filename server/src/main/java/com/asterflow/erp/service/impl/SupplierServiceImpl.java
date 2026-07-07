package com.asterflow.erp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.asterflow.erp.common.BusinessException;
import com.asterflow.erp.dto.PageResponse;
import com.asterflow.erp.dto.SupplierRequest;
import com.asterflow.erp.dto.SupplierResponse;
import com.asterflow.erp.enums.SupplierStatus;
import com.asterflow.erp.mapper.SupplierMapper;
import com.asterflow.erp.service.SupplierService;
import entity.Supplier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SupplierServiceImpl implements SupplierService {

    private final SupplierMapper supplierMapper;

    public SupplierServiceImpl(SupplierMapper supplierMapper) {
        this.supplierMapper = supplierMapper;
    }

    @Override
    @Transactional
    public SupplierResponse create(SupplierRequest request) {
        Long count = supplierMapper.selectCount(
                new LambdaQueryWrapper<Supplier>()
                        .eq(Supplier::getSupplierCode, request.getSupplierCode())
        );

        if (count > 0) {
            throw new BusinessException("供应商编码已存在");
        }

        Supplier supplier = new Supplier();
        supplier.setSupplierCode(request.getSupplierCode());
        supplier.setName(request.getName());
        supplier.setContactName(request.getContactName());
        supplier.setPhone(request.getPhone());
        supplier.setAddress(request.getAddress());
        supplier.setStatus(SupplierStatus.ACTIVE.name());

        supplierMapper.insert(supplier);

        return toResponse(supplier);


    }

    private SupplierResponse toResponse(Supplier supplier) {
        SupplierResponse response = new SupplierResponse();

        response.setId(supplier.getId());
        response.setSupplierCode(supplier.getSupplierCode());
        response.setName(supplier.getName());
        response.setContactName(supplier.getContactName());
        response.setPhone(supplier.getPhone());
        response.setAddress(supplier.getAddress());
        response.setStatus(supplier.getStatus());
        response.setCreatedAt(supplier.getCreatedAt());
        response.setUpdatedAt(supplier.getUpdatedAt());

        return response;
    }

    @Override
    public SupplierResponse getById(Long id) {
        Supplier supplier = supplierMapper.selectById(id);

        if (supplier == null) {
            throw new BusinessException("供应商不存在");
        }

        return toResponse(supplier);
    }

    @Override
    public PageResponse<SupplierResponse> pageList(String keyword, String status, long page, long size) {
        LambdaQueryWrapper<Supplier> wrapper = new LambdaQueryWrapper<>();

        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w.like(Supplier::getSupplierCode, keyword)
                    .or()
                    .like(Supplier::getName, keyword)
                    .or()
                    .like(Supplier::getContactName, keyword)
                    .or()
                    .like(Supplier::getPhone, keyword));
        }

        if (status != null && !status.isBlank()) {
            wrapper.eq(Supplier::getStatus, status);
        }

        wrapper.orderByDesc(Supplier::getCreatedAt)
                .orderByDesc(Supplier::getId);

        Page<Supplier> supplierPage = new Page<>(page, size);

        Page<Supplier> result = supplierMapper.selectPage(supplierPage, wrapper);

        List<SupplierResponse> records = result.getRecords()
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
    public SupplierResponse update(Long id, SupplierRequest request) {
        Supplier supplier = supplierMapper.selectById(id);

        if (supplier == null) {
            throw new BusinessException("供应商不存在");
        }

        Long count = supplierMapper.selectCount(
                new LambdaQueryWrapper<Supplier>()
                        .eq(Supplier::getSupplierCode, request.getSupplierCode())
                        .ne(Supplier::getId, id)
        );

        if (count > 0) {
            throw new BusinessException("供应商编码已存在");
        }

        supplier.setSupplierCode(request.getSupplierCode());
        supplier.setName(request.getName());
        supplier.setContactName(request.getContactName());
        supplier.setPhone(request.getPhone());
        supplier.setAddress(request.getAddress());

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            supplier.setStatus(request.getStatus());
        }

        supplierMapper.updateById(supplier);

        return toResponse(supplier);
    }

    @Override
    @Transactional
    public void active(Long id) {
        Supplier supplier = supplierMapper.selectById(id);

        if (supplier == null) {
            throw new BusinessException("供应商不存在");
        }

        supplier.setStatus(SupplierStatus.ACTIVE.name());

        supplierMapper.updateById(supplier);
    }

    @Override
    @Transactional
    public void inactive(Long id) {
        Supplier supplier = supplierMapper.selectById(id);

        if (supplier == null) {
            throw new BusinessException("供应商不存在");
        }

        supplier.setStatus(SupplierStatus.INACTIVE.name());

        supplierMapper.updateById(supplier);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Supplier supplier = supplierMapper.selectById(id);

        if (supplier == null) {
            throw new BusinessException("供应商不存在");
        }

        supplierMapper.deleteById(id);
    }
}
