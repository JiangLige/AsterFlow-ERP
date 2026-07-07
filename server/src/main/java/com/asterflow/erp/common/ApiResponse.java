package com.asterflow.erp.common;

import java.time.LocalDateTime;

public class ApiResponse<T> {

    private final boolean success;
    private final String code;
    private final String message;
    private final T data;
    private final LocalDateTime timestamp;

    private ApiResponse(boolean success, ErrorCode code, String message, T data) {
        this.success = success;
        this.code = code.getCode();
        this.message = message;
        this.data = data;
        this.timestamp = LocalDateTime.now();
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, ErrorCode.SUCCESS, "success", data);
    }

    public static ApiResponse<Void> success() {
        return new ApiResponse<>(true, ErrorCode.SUCCESS, "success", null);
    }

    public static ApiResponse<Void> fail(String message) {
        return fail(ErrorCode.BUSINESS_ERROR, message);
    }

    public static ApiResponse<Void> fail(ErrorCode code, String message) {
        return new ApiResponse<>(false, code, message, null);
    }

    public boolean isSuccess() {
        return success;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public T getData() {
        return data;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }
}
