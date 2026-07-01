package com.demo.erp.controller;

import com.demo.erp.common.ApiResponse;
import com.demo.erp.dto.CustomerRequest;
import com.demo.erp.dto.CustomerResponse;
import com.demo.erp.dto.PageResponse;
import com.demo.erp.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
@Tag(name = "客户管理", description = "客户资料维护、查询与删除接口")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    @Operation(summary = "新增客户", description = "创建客户基础资料，客户编码必须保持业务唯一。")
    public ApiResponse<CustomerResponse> create(@Valid @RequestBody CustomerRequest request) {
        return ApiResponse.success(customerService.create(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "查看客户详情", description = "根据客户 ID 查询单个客户的基础资料。")
    public ApiResponse<CustomerResponse> getById(
            @Parameter(description = "客户ID", example = "1")
            @PathVariable Long id) {
        return ApiResponse.success(customerService.getById(id));
    }

    @GetMapping
    @Operation(summary = "分页查询客户", description = "按客户编码、名称、联系人或状态分页查询客户资料。")
    public ApiResponse<PageResponse<CustomerResponse>> pageList(
            @Parameter(description = "客户编码、名称或联系人关键字")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "客户状态，例如 ACTIVE、INACTIVE")
            @RequestParam(required = false) String status,
            @Parameter(description = "页码，从 1 开始", example = "1")
            @RequestParam(defaultValue = "1") long page,
            @Parameter(description = "每页数量", example = "10")
            @RequestParam(defaultValue = "10") long size
    ) {
        return ApiResponse.success(customerService.pageList(keyword, status, page, size));
    }

    @PutMapping("/{id}")
    @Operation(summary = "编辑客户", description = "更新客户基础资料、联系人、电话、地址和状态。")
    public ApiResponse<CustomerResponse> update(
            @Parameter(description = "客户ID", example = "1")
            @PathVariable Long id,
            @Valid @RequestBody CustomerRequest request
    ) {
        return ApiResponse.success(customerService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除客户", description = "删除客户资料。")
    public ApiResponse<Void> delete(
            @Parameter(description = "客户ID", example = "1")
            @PathVariable Long id) {
        customerService.delete(id);
        return ApiResponse.success();
    }
}
