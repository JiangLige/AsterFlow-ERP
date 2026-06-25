package com.demo.erp.controller;

import com.demo.erp.common.ApiResponse;
import com.demo.erp.dto.PageResponse;
import com.demo.erp.dto.SupplierRequest;
import com.demo.erp.dto.SupplierResponse;
import com.demo.erp.service.SupplierService;
import com.demo.erp.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @PostMapping
    public ApiResponse<SupplierResponse> create(@Valid @RequestBody SupplierRequest request) {
        return ApiResponse.success(supplierService.create(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<SupplierResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(supplierService.getById(id));
    }

    @GetMapping
    public ApiResponse<PageResponse<SupplierResponse>> pageList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "10") long size) {
        return ApiResponse.success(supplierService.pageList(keyword, status, page, size));
    }

    @PutMapping("/{id}")
    public ApiResponse<SupplierResponse> update(@PathVariable Long id,
                                                @Valid @RequestBody SupplierRequest request) {
        return ApiResponse.success(supplierService.update(id, request));
    }

    @PatchMapping("/{id}/active")
    public ApiResponse<Void> active(@PathVariable Long id) {
        supplierService.active(id);
        return ApiResponse.success();
    }

    @PatchMapping("/{id}/inactive")
    public ApiResponse<Void> inactive(@PathVariable Long id) {
        supplierService.inactive(id);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        AuthUtil.requireAdmin(request);
        supplierService.delete(id);
        return ApiResponse.success();
    }
}