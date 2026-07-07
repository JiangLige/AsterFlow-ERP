package com.asterflow.erp.controller;

import com.asterflow.erp.common.ApiResponse;
import com.asterflow.erp.dto.PageResponse;
import com.asterflow.erp.dto.SupplierRequest;
import com.asterflow.erp.dto.SupplierResponse;
import com.asterflow.erp.service.SupplierService;
import com.asterflow.erp.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/suppliers")
@Tag(name = "供应商管理", description = "供应商资料维护、状态管理与删除接口")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @Operation(summary = "新增供应商", description = "创建供应商基础资料，供应商编码必须保持业务唯一")
    @PostMapping
    public ApiResponse<SupplierResponse> create(@Valid @RequestBody SupplierRequest request) {
        return ApiResponse.success(supplierService.create(request));
    }

    @Operation(summary = "查看供应商详情", description = "根据供应商 ID 查询单个供应商的基础资料")
    @GetMapping("/{id}")
    public ApiResponse<SupplierResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(supplierService.getById(id));
    }

    @Operation(summary = "分页查询供应商", description = "按供应商编码、名称、联系人或状态分页查询供应商资料")
    @GetMapping
    public ApiResponse<PageResponse<SupplierResponse>> pageList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "10") long size) {
        return ApiResponse.success(supplierService.pageList(keyword, status, page, size));
    }

    @Operation(summary = "编辑供应商", description = "更新供应商基础资料、联系人、电话、地址和状态")
    @PutMapping("/{id}")
    public ApiResponse<SupplierResponse> update(@PathVariable Long id,
                                                @Valid @RequestBody SupplierRequest request) {
        return ApiResponse.success(supplierService.update(id, request));
    }

    @Operation(summary = "启用供应商", description = "将停用供应商恢复为可用状态")
    @PatchMapping("/{id}/active")
    public ApiResponse<Void> active(@PathVariable Long id, HttpServletRequest request) {
        AuthUtil.requireAdmin(request);
        supplierService.active(id);
        return ApiResponse.success();
    }

    @Operation(summary = "停用供应商", description = "停用供应商后，业务侧应避免继续用于新的采购")
    @PatchMapping("/{id}/inactive")
    public ApiResponse<Void> inactive(@PathVariable Long id, HttpServletRequest request) {
        AuthUtil.requireAdmin(request);
        supplierService.inactive(id);
        return ApiResponse.success();
    }

    @Operation(summary = "删除供应商", description = "删除供应商资料")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        AuthUtil.requireAdmin(request);
        supplierService.delete(id);
        return ApiResponse.success();
    }
}
