package com.demo.erp.controller;

import com.demo.erp.common.ApiResponse;
import com.demo.erp.dto.PageResponse;
import com.demo.erp.dto.PurchaseOrderCreateRequest;
import com.demo.erp.dto.PurchaseOrderResponse;
import com.demo.erp.service.PurchaseOrderService;
import com.demo.erp.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @PostMapping
    public ApiResponse<PurchaseOrderResponse> create(
            @Valid @RequestBody PurchaseOrderCreateRequest request) {
        return ApiResponse.success(purchaseOrderService.create(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<PurchaseOrderResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(purchaseOrderService.getById(id));
    }

    @GetMapping
    public ApiResponse<PageResponse<PurchaseOrderResponse>> pageList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "10") long size) {
        return ApiResponse.success(purchaseOrderService.pageList(keyword, status, page, size));
    }

    @PatchMapping("/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Long id, HttpServletRequest request) {
        purchaseOrderService.approve(id, AuthUtil.currentOperator(request));
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        AuthUtil.requireAdmin(request);
        purchaseOrderService.delete(id);
        return ApiResponse.success();
    }

    @PutMapping("/{id}")
    public ApiResponse<PurchaseOrderResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody PurchaseOrderCreateRequest request) {
        return ApiResponse.success(purchaseOrderService.update(id, request));
    }

    @PatchMapping("/{id}/cancel")
    public ApiResponse<Void> cancel(@PathVariable Long id, HttpServletRequest request) {
        purchaseOrderService.cancel(id, AuthUtil.currentOperator(request));
        return ApiResponse.success();
    }

}
