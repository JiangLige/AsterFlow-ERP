package com.demo.erp.service;

import com.demo.erp.dto.auth.CurrentUserResponse;
import com.demo.erp.dto.auth.LoginRequest;
import com.demo.erp.dto.auth.LoginResponse;

public interface UserService {

    LoginResponse login(LoginRequest request);

    LoginResponse refresh(String refreshToken);

    void logout(String accessToken, String refreshToken);

    CurrentUserResponse currentUser(Long userId);
}