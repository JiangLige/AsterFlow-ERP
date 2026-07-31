package com.asterFlow.erp.controller;

import com.asterFlow.erp.common.ApiResponse;
import com.asterFlow.erp.dto.PageResponse;
import com.asterFlow.erp.dto.sale.SaleOrderCreateRequest;
import com.asterFlow.erp.dto.sale.SaleOrderResponse;
import com.asterFlow.erp.service.AuditLogService;
import com.asterFlow.erp.service.SaleOrderService;
import com.asterFlow.erp.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sale-orders")
public class SaleOrderController {

    private final SaleOrderService saleOrderService;
    private final AuditLogService auditLogService;

    public SaleOrderController(SaleOrderService saleOrderService, AuditLogService auditLogService) {
        this.saleOrderService = saleOrderService;
        this.auditLogService = auditLogService;
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
                "审核销售单并出库"
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
                "取消销售单并恢复库存"
        );

        return ApiResponse.success();
    }
}