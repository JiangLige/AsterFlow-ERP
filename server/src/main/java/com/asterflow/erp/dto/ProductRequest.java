package com.asterflow.erp.dto;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "商品创建或编辑请求")
public class ProductRequest {

    @Schema(description = "最低库存阈值，用于库存预警", example = "10")
    @Min(value = 0, message = "最低库存不能小于0")
    private Integer minStock;

    @Schema(description = "商品编码，业务唯一", example = "P-10001")
    @NotBlank(message = "商品编码不能为空")
    private String productCode;

    @Schema(description = "商品名称", example = "无线鼠标")
    @NotBlank(message = "商品名称不能为空")
    private String name;

    @Schema(description = "商品分类", example = "办公用品")
    @NotBlank(message = "商品分类不能为空")
    private String category;

    @Schema(description = "计量单位", example = "")
    @NotBlank(message = "单位不能为空")
    private String unit;

    @Schema(description = "销售价", example = "99.00")
    @NotNull(message = "销售价不能为空")
    @DecimalMin(value = "0.00", message = "销售价不能小于0")
    private BigDecimal price;

    @Schema(description = "成本", example = "60.00")
    @NotNull(message = "成本价不能为空")
    @DecimalMin(value = "0.00", message = "成本价不能小于0")
    private BigDecimal cost;

    @Schema(description = "当前库存", example = "100")
    @NotNull(message = "库存不能为空")
    @Min(value = 0, message = "库存不能小于0")
    private Integer stock;

    @Schema(description = "商品状态", example = "ACTIVE")
    @Size(max = 20, message = "状态不能超过20个字")
    private String status;

    @Schema(description = "商品描述", example = "适用于日常办公场景")
    @Size(max = 500, message = "描述不能超过500个字")
    private String description;

    public Integer getMinStock() {
        return minStock;
    }

    public void setMinStock(Integer minStock) {
        this.minStock = minStock;
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
}
