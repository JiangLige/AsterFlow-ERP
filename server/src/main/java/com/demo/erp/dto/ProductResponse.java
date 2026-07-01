package com.demo.erp.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "商品响应数据")
public class ProductResponse {

    @Schema(description = "商品ID", example = "1")
    private Long id;

    @Schema(description = "商品编码，业务唯一", example = "P-10001")
    private String productCode;

    @Schema(description = "商品名称", example = "无线鼠标")
    private String name;

    @Schema(description = "商品分类", example = "办公用品")
    private String category;

    @Schema(description = "计量单位", example = "个")
    private String unit;

    @Schema(description = "销售价", example = "99.00")
    private BigDecimal price;

    @Schema(description = "成本价", example = "60.00")
    private BigDecimal cost;

    @Schema(description = "当前库存", example = "100")
    private Integer stock;

    @Schema(description = "商品状态", example = "ACTIVE")
    private String status;

    @Schema(description = "商品描述", example = "适用于日常办公场景")
    private String description;

    @Schema(description = "创建时间")
    private LocalDateTime createdAt;

    @Schema(description = "更新时间")
    private LocalDateTime updatedAt;

    @Schema(description = "最低库存阈值，用于库存预警", example = "10")
    private Integer minStock;

    public Integer getMinStock() {
        return minStock;
    }

    public void setMinStock(Integer minStock) {
        this.minStock = minStock;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getCost() {
        return cost;
    }

    public void setCost(BigDecimal cost) {
        this.cost = cost;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
