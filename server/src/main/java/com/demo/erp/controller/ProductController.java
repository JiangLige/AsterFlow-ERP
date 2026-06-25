package com.demo.erp.controller;

import com.demo.erp.common.ApiResponse;
import com.demo.erp.dto.*;
import com.demo.erp.service.ProductService;
import com.demo.erp.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    public ApiResponse<ProductResponse> create(@Valid @RequestBody ProductRequest productRequest) {
        return ApiResponse.success(productService.create(productRequest));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(productService.getById(id));
    }

    @PatchMapping("/{id}/active")
    public ApiResponse<Void> active(@PathVariable Long id) {
        productService.active(id);
        return ApiResponse.success();
    }

    @PatchMapping("/{id}/inactive")
    public ApiResponse<Void> inactive(@PathVariable Long id) {
        productService.inactive(id);
        return ApiResponse.success();
    }

    @PatchMapping("/{id}/stock")
    public ApiResponse<Void> adjustStock(@PathVariable Long id,
                                         @Valid @RequestBody StockAdjustRequest request) {
        productService.adjustStock(id, request);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        AuthUtil.requireAdmin(request);
        productService.delete(id);
        return ApiResponse.success();
    }

    @GetMapping("/warnings")
    public ApiResponse<List<ProductResponse>> warningList() {
        return ApiResponse.success(productService.warningList());
    }

    @GetMapping("/{id}/stock-records")
    public ApiResponse<PageResponse<StockRecordResponse>> pageStockRecords(
            @PathVariable Long id,
            @RequestParam(required = false) String type,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime startTime,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime endTime,
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "10") long size) {
        return ApiResponse.success(productService.pageStockRecords(id, type, startTime, endTime, page, size));
    }

    @GetMapping
    public ApiResponse<PageResponse<ProductResponse>> pageList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "10") long size) {
        return ApiResponse.success(productService.pageList(keyword, status, page, size));
    }

    @PutMapping("/{id}")
    public ApiResponse<ProductResponse> update(@PathVariable Long id,
                                               @Valid @RequestBody ProductRequest request) {
        return ApiResponse.success(productService.update(id, request));
    }

}