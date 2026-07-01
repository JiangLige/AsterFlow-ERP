package com.demo.erp.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "供应商创建或编辑请求")
public class SupplierRequest {

    @Schema(description = "供应商编码，业务唯一", example = "SUP-10001")
    @NotBlank(message = "供应商编码不能为空")
    private String supplierCode;

    @NotBlank(message = "供应商名称不能为空")
    private String name;

    @Size(max = 50, message = "联系人不能超过50个字符")
    private String contactName;

    @Size(max = 30, message = "联系电话不能超过30个字符")
    private String phone;

    @Size(max = 255, message = "地址不能超过255个字符")
    private String address;

    @Size(max = 20, message = "状态不能超过20个字符")
    private String status;

    public String getSupplierCode() {
        return supplierCode;
    }

    public void setSupplierCode(String supplierCode) {
        this.supplierCode = supplierCode;
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

}