package com.asterflow.erp.dto.sale;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public class SaleOrderCreateRequest {

    @NotNull(message = "客户不能为空")
    private Long customerId;

    @Size(max = 500, message = "备注不能超过500个字")
    private String remark;

    @Valid
    @NotEmpty(message = "销售单明细不能为空")
    private List<SaleOrderItemRequest> items;

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public List<SaleOrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<SaleOrderItemRequest> items) {
        this.items = items;
    }
}
