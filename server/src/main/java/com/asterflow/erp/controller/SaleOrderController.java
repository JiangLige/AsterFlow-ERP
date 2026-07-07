package com.asterflow.erp.controller;

import com.asterflow.erp.common.ApiResponse;
import com.asterflow.erp.dto.PageResponse;
import com.asterflow.erp.dto.sale.SaleOrderCreateRequest;
import com.asterflow.erp.dto.sale.SaleOrderResponse;
import com.asterflow.erp.service.AuditLogService;
import com.asterflow.erp.service.IdempotencyService;
import com.asterflow.erp.service.SaleOrderService;
import com.asterflow.erp.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sale-orders")
public class SaleOrderController {

    private final SaleOrderService saleOrderService;
    private final AuditLogService auditLogService;
    private final IdempotencyService idempotencyService;

    public SaleOrderController(SaleOrderService saleOrderService, AuditLogService auditLogService, IdempotencyService idempotencyService) {
        this.saleOrderService = saleOrderService;
        this.auditLogService = auditLogService;
        this.idempotencyService = idempotencyService;
    }

    private void requireFirstExecution(HttpServletRequest request, String action, Long id) {
        String key = request.getHeader("Idempotency-Key");
        Object userId = request.getAttribute("userId");
        String scope = userId + ":" + action + ":" + id;
        idempotencyService.requireFirstExecution(scope, key);
    }

    @PostMapping
    public ApiResponse<SaleOrderResponse> create(@Valid @RequestBody SaleOrderCreateRequest request) {
        return ApiResponse.success(saleOrderService.create(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<SaleOrderResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(saleOrderService.getById(id));
    }

    @GetMapping
    public ApiResponse<PageResponse<SaleOrderResponse>> pageList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "10") long size) {
        return ApiResponse.success(saleOrderService.pageList(keyword, status, page, size));
    }

    @PatchMapping("/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Long id, HttpServletRequest request) {
        requireFirstExecution(request, "sale-order:approve", id);
        saleOrderService.approve(id);

        SaleOrderResponse order = saleOrderService.getById(id);

        auditLogService.record(
                (Long) request.getAttribute("userId"),
                (String) request.getAttribute("username"),
                (String) request.getAttribute("role"),
                "SALE_APPROVE",
                "SALE_ORDER",
                id,
                order.getOrderNo(),
                "审核销售单并出"
        );

        return ApiResponse.success();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        AuthUtil.requireAdmin(request);
        saleOrderService.delete(id);
        return ApiResponse.success();
    }

    @PutMapping("/{id}")
    public ApiResponse<SaleOrderResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody SaleOrderCreateRequest request) {
        return ApiResponse.success(saleOrderService.update(id, request));
    }

    @PatchMapping("/{id}/cancel")
    public ApiResponse<Void> cancel(@PathVariable Long id, HttpServletRequest request) {
        requireFirstExecution(request, "sale-order:cancel", id);
        saleOrderService.cancel(id);

        SaleOrderResponse order = saleOrderService.getById(id);

        auditLogService.record(
                (Long) request.getAttribute("userId"),
                (String) request.getAttribute("username"),
                (String) request.getAttribute("role"),
                "SALE_CANCEL",
                "SALE_ORDER",
                id,
                order.getOrderNo(),
                "取消销售单并恢复库"
        );

        return ApiResponse.success();
    }
}