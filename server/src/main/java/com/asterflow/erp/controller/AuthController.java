package com.asterflow.erp.controller;

import com.asterflow.erp.common.ApiResponse;
import com.asterflow.erp.dto.auth.CurrentUserResponse;
import com.asterflow.erp.dto.auth.LoginRequest;
import com.asterflow.erp.dto.auth.LoginResponse;
import com.asterflow.erp.dto.auth.RefreshTokenRequest;
import com.asterflow.erp.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(userService.login(request));
    }

    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.success(userService.refresh(request.getRefreshToken()));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        userService.logout(authorization, request.getRefreshToken());
        return ApiResponse.success();
    }

    @GetMapping("/me")
    public ApiResponse<CurrentUserResponse> me(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        return ApiResponse.success(userService.currentUser(userId));
    }
}