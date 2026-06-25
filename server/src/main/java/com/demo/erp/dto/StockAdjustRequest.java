package com.demo.erp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class StockAdjustRequest {

    @NotNull(message = "库存变化数量不能为空")
    private Integer changeQuantity;

    @NotBlank(message = "库存变化类型不能为空")
    private String type;

    @Size(max = 500, message = "备注不能超过500个字符")
    private String remark;

    public Integer getChangeQuantity() {
        return changeQuantity;
    }

    public void setChangeQuantity(Integer changeQuantity) {
        this.changeQuantity = changeQuantity;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}