package com.asterflow.erp.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public class PurchaseOrderCreateRequest {

    @NotNull(message = "供应商ID不能为空")
    private Long supplierId;

    @Size(max = 500, message = "备注不能超过500个字")
    private String remark;

    @Valid
    @NotEmpty(message = "采购明细不能为空")
    private List<PurchaseOrderItemRequest> items;

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public List<PurchaseOrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<PurchaseOrderItemRequest> items) {
        this.items = items;
    }


}