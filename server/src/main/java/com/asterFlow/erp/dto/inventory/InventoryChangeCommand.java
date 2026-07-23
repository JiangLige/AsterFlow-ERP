package com.asterFlow.erp.dto.inventory;

public class InventoryChangeCommand {

    private Long productId;
    private Integer quantity;
    private String sourceType;
    private Long sourceId;
    private String sourceNo;
    private String remark;

    public InventoryChangeCommand() {
    }

    public InventoryChangeCommand(Long productId,
                                  Integer quantity,
                                  String sourceType,
                                  Long sourceId,
                                  String sourceNo,
                                  String remark) {
        this.productId = productId;
        this.quantity = quantity;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.sourceNo = sourceNo;
        this.remark = remark;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getSourceType() {
        return sourceType;
    }

    public void setSourceType(String sourceType) {
        this.sourceType = sourceType;
    }

    public Long getSourceId() {
        return sourceId;
    }

    public void setSourceId(Long sourceId) {
        this.sourceId = sourceId;
    }

    public String getSourceNo() {
        return sourceNo;
    }

    public void setSourceNo(String sourceNo) {
        this.sourceNo = sourceNo;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}
