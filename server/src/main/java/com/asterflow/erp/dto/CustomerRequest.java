package com.asterflow.erp.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "客户创建或编辑请求")
public class CustomerRequest {

    @Schema(description = "客户编码，业务唯一", example = "C-10001")
    @NotBlank(message = "客户编码不能为空")
    private String customerCode;

    @Schema(description = "客户名称", example = "上海示例科技有限公司")
    @NotBlank(message = "客户名称不能为空")
    private String name;

    @Schema(description = "联系人姓名", example = "张三")
    @Size(max = 50, message = "联系人不能超过50个字")
    private String contactName;

    @Schema(description = "联系电话", example = "13800000000")
    @Size(max = 30, message = "联系电话不能超过30个字")
    private String phone;

    @Schema(description = "客户地址", example = "上海市浦东新区示例路 100 ")
    @Size(max = 255, message = "地址不能超过255个字")
    private String address;

    @Schema(description = "客户状态", example = "ACTIVE")
    @Size(max = 20, message = "状态不能超过20个字")
    private String status;

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
}
