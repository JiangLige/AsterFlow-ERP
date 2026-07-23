package com.asterFlow.erp.controller;

import com.asterFlow.erp.common.ApiResponse;
import com.asterFlow.erp.dto.PageResponse;
import com.asterFlow.erp.dto.PurchaseOrderCreateRequest;
import com.asterFlow.erp.dto.PurchaseOrderResponse;
import com.asterFlow.erp.service.AuditLogService;
import com.asterFlow.erp.service.PurchaseOrderService;
import com.asterFlow.erp.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final AuditLogService auditLogService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService, AuditLogService auditLogService) {
        this.purchaseOrderService = purchaseOrderService;
        this.auditLogService = auditLogService;
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
        purchaseOrderService.approve(id);

        PurchaseOrderResponse order = purchaseOrderService.getById(id);

        auditLogService.record(
                (Long) request.getAttribute("userId"),
                (String) request.getAttribute("username"),
                (String) request.getAttribute("role"),
                "PURCHASE_APPROVE",
                "PURCHASE_ORDER",
                id,
                order.getOrderNo(),
                "审核采购单并入库"
        );

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
        purchaseOrderService.cancel(id);

        PurchaseOrderResponse order = purchaseOrderService.getById(id);

        auditLogService.record(
                (Long) request.getAttribute("userId"),
                (String) request.getAttribute("username"),
                (String) request.getAttribute("role"),
                "PURCHASE_CANCEL",
                "PURCHASE_ORDER",
                id,
                order.getOrderNo(),
                "取消采购单并扣回库存"
        );

        return ApiResponse.success();
    }

}