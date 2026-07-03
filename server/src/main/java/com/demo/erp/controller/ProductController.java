package com.demo.erp.controller;

import com.demo.erp.common.ApiResponse;
import com.demo.erp.dto.*;
import com.demo.erp.service.IdempotencyService;
import com.demo.erp.service.ProductService;
import com.demo.erp.util.AuthUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@Tag(name = "商品管理", description = "商品资料、状态、库存调整与库存预警接口")
public class ProductController {

    private final ProductService productService;
    private final IdempotencyService idempotencyService;

    public ProductController(ProductService productService, IdempotencyService idempotencyService) {
        this.productService = productService;
        this.idempotencyService = idempotencyService;
    }

    @PostMapping
    @Operation(summary = "新增商品", description = "创建商品基础资料，商品编码必须保持业务唯一。")
    public ApiResponse<ProductResponse> create(@Valid @RequestBody ProductRequest productRequest) {
        return ApiResponse.success(productService.create(productRequest));
    }

    @GetMapping("/{id}")
    @Operation(summary = "查看商品详情", description = "根据商品 ID 查询单个商品的基础资料和库存信息。")
    public ApiResponse<ProductResponse> getById(
            @Parameter(description = "商品ID", example = "1")
            @PathVariable Long id) {
        return ApiResponse.success(productService.getById(id));
    }

    @PatchMapping("/{id}/active")
    @Operation(summary = "启用商品", description = "将停用商品恢复为可用状态。")
    public ApiResponse<Void> active(
            @Parameter(description = "商品ID", example = "1")
            @PathVariable Long id) {
        productService.active(id);
        return ApiResponse.success();
    }

    @PatchMapping("/{id}/inactive")
    @Operation(summary = "停用商品", description = "停用商品后，业务侧应避免继续用于新的采购或销售。")
    public ApiResponse<Void> inactive(
            @Parameter(description = "商品ID", example = "1")
            @PathVariable Long id) {
        productService.inactive(id);
        return ApiResponse.success();
    }

    @PatchMapping("/{id}/stock")
    @Operation(summary = "调整商品库存", description = "手工调整商品库存，并生成库存流水记录。")
    public ApiResponse<Void> adjustStock(
            @Parameter(description = "商品ID", example = "1")
            @PathVariable Long id,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody StockAdjustRequest stockRequest,
            HttpServletRequest httpRequest
    ) {
        idempotencyService.requireFirstExecution("product-stock-adjust:" + id, idempotencyKey);
        productService.adjustStock(id, stockRequest, AuthUtil.currentOperator(httpRequest));
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除商品", description = "删除商品资料。该操作需要管理员权限。")
    public ApiResponse<Void> delete(
            @Parameter(description = "商品ID", example = "1")
            @PathVariable Long id,
            HttpServletRequest request) {
        AuthUtil.requireAdmin(request);
        productService.delete(id);
        return ApiResponse.success();
    }

    @GetMapping("/warnings")
    @Operation(summary = "查询库存预警商品", description = "查询当前库存低于最低库存阈值的商品列表。")
    public ApiResponse<List<ProductResponse>> warningList() {
        return ApiResponse.success(productService.warningList());
    }

    @GetMapping("/{id}/stock-records")
    @Operation(summary = "分页查询商品库存流水", description = "按商品 ID 查询入库、出库、调整等库存变更记录。")
    public ApiResponse<PageResponse<StockRecordResponse>> pageStockRecords(
            @Parameter(description = "商品ID", example = "1")
            @PathVariable Long id,
            @Parameter(description = "库存变更类型，例如 IN、OUT、ADJUST")
            @RequestParam(required = false) String type,
            @Parameter(description = "开始时间，ISO-8601 格式")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime startTime,
            @Parameter(description = "结束时间，ISO-8601 格式")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime endTime,
            @Parameter(description = "页码，从 1 开始", example = "1")
            @RequestParam(defaultValue = "1") long page,
            @Parameter(description = "每页数量", example = "10")
            @RequestParam(defaultValue = "10") long size) {
        return ApiResponse.success(productService.pageStockRecords(id, type, startTime, endTime, page, size));
    }

    @GetMapping
    @Operation(summary = "分页查询商品", description = "按关键字、状态分页查询商品资料。")
    public ApiResponse<PageResponse<ProductResponse>> pageList(
            @Parameter(description = "商品编码、名称或分类关键字")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "商品状态，例如 ACTIVE、INACTIVE")
            @RequestParam(required = false) String status,
            @Parameter(description = "页码，从 1 开始", example = "1")
            @RequestParam(defaultValue = "1") long page,
            @Parameter(description = "每页数量", example = "10")
            @RequestParam(defaultValue = "10") long size) {
        return ApiResponse.success(productService.pageList(keyword, status, page, size));
    }

    @PutMapping("/{id}")
    @Operation(summary = "编辑商品", description = "更新商品基础资料和库存阈值。")
    public ApiResponse<ProductResponse> update(
            @Parameter(description = "商品ID", example = "1")
            @PathVariable Long id,
                                               @Valid @RequestBody ProductRequest request) {
        return ApiResponse.success(productService.update(id, request));
    }

}
