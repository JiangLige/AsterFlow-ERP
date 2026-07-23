package com.asterFlow.erp.dto;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "客户响应数据")
public class CustomerResponse {

    @Schema(description = "客户ID", example = "1")
    private Long id;

    @Schema(description = "客户编码，业务唯一", example = "C-10001")
    private String customerCode;

    @Schema(description = "客户名称", example = "上海示例科技有限公司")
    private String name;

    @Schema(description = "联系人姓名", example = "张三")
    private String contactName;

    @Schema(description = "联系电话", example = "13800000000")
    private String phone;

    @Schema(description = "客户地址", example = "上海市浦东新区示例路 100 号")
    private String address;

    @Schema(description = "客户状态", example = "ACTIVE")
    private String status;

    @Schema(description = "创建时间")
    private LocalDateTime createdAt;

    @Schema(description = "更新时间")
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCustomerCode() {
        return customerCode;
    }

    public void setCustomerCode(String customerCode) {
        this.customerCode = customerCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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
