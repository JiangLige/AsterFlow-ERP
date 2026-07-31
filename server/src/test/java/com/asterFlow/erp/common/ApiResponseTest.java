package com.asterFlow.erp.common;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ApiResponseTest {

    @Test
    void successResponseUsesStableSuccessCode() {
        ApiResponse<String> response = ApiResponse.success("ok");

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getCode()).isEqualTo("SUCCESS");
        assertThat(response.getMessage()).isEqualTo("success");
        assertThat(response.getData()).isEqualTo("ok");
        assertThat(response.getTimestamp()).isNotNull();
    }

    @Test
    void failResponseUsesProvidedErrorCode() {
        ApiResponse<Void> response = ApiResponse.fail(ErrorCode.VALIDATION_ERROR, "参数错误");

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getCode()).isEqualTo("VALIDATION_ERROR");
        assertThat(response.getMessage()).isEqualTo("参数错误");
        assertThat(response.getData()).isNull();
        assertThat(response.getTimestamp()).isNotNull();
    }
}
