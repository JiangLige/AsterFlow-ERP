package com.demo.erp.dto.sale;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public class SaleOrderCreateRequest {

    @NotBlank(message = "客户名称不能为空")
    private String customerName;

    @Size(max = 500, message = "备注不能超过500个字符")
    private String remark;

    @Valid
    @NotEmpty(message = "销售商品明细不能为空")
    private List<SaleOrderItemRequest> items;

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
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

    // 生成 getter / setter
}