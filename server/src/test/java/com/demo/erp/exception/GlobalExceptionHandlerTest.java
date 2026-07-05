package com.demo.erp.exception;

import com.demo.erp.common.ApiResponse;
import com.demo.erp.common.BusinessException;
import com.demo.erp.common.ErrorCode;
import com.demo.erp.dto.auth.LoginRequest;
import jakarta.validation.Valid;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.RequestBody;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void businessExceptionUsesItsErrorCodeAndHttpStatus() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleBusinessException(
                new BusinessException(ErrorCode.FORBIDDEN, "无权限操作")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo("FORBIDDEN");
        assertThat(response.getBody().getMessage()).isEqualTo("无权限操作");
    }

    @Test
    void validationExceptionUsesValidationErrorCode() throws Exception {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new LoginRequest(), "loginRequest");
        bindingResult.addError(new FieldError("loginRequest", "username", "用户名不能为空"));

        Method method = GlobalExceptionHandlerTest.class.getDeclaredMethod("login", LoginRequest.class);
        MethodArgumentNotValidException exception = new MethodArgumentNotValidException(
                new MethodParameter(method, 0),
                bindingResult
        );

        ResponseEntity<ApiResponse<Void>> response = handler.handleValidationException(exception);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo("VALIDATION_ERROR");
        assertThat(response.getBody().getMessage()).contains("username: 用户名不能为空");
    }

    @Test
    void duplicateKeyExceptionUsesConflictStatus() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleDuplicateKeyException(
                new DuplicateKeyException("duplicate")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo("DUPLICATE_KEY");
        assertThat(response.getBody().getMessage()).isEqualTo("数据已存在，请检查唯一字段");
    }

    @Test
    void unknownExceptionDoesNotExposeInternalMessage() {
        ResponseEntity<ApiResponse<Void>> response = handler.handleException(
                new IllegalStateException("database password leaked")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo("SYSTEM_ERROR");
        assertThat(response.getBody().getMessage()).isEqualTo("系统异常，请稍后再试");
    }

    @SuppressWarnings("unused")
    private void login(@Valid @RequestBody LoginRequest request) {
    }
}
