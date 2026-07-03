package com.demo.erp.controller;

import com.demo.erp.common.ApiResponse;
import com.demo.erp.dto.PageResponse;
import com.demo.erp.dto.sale.SaleOrderCreateRequest;
import com.demo.erp.dto.sale.SaleOrderResponse;
import com.demo.erp.service.IdempotencyService;
import com.demo.erp.service.SaleOrderService;
import com.demo.erp.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sale-orders")
public class SaleOrderController {

    private final SaleOrderService saleOrderService;
    private final IdempotencyService idempotencyService;

    public SaleOrderController(SaleOrderService saleOrderService, IdempotencyService idempotencyService) {
        this.saleOrderService = saleOrderService;
        this.idempotencyService = idempotencyService;
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
    public ApiResponse<Void> approve(
            @PathVariable Long id,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request
    ) {
        idempotencyService.requireFirstExecution("sale-order-approve:" + id, idempotencyKey);
        saleOrderService.approve(id, AuthUtil.currentOperator(request));
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
    public ApiResponse<Void> cancel(
            @PathVariable Long id,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request
    ) {
        idempotencyService.requireFirstExecution("sale-order-cancel:" + id, idempotencyKey);
        saleOrderService.cancel(id, AuthUtil.currentOperator(request));
        return ApiResponse.success();
    }
}
