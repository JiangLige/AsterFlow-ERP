package com.asterflow.erp.service;

import com.asterflow.erp.dto.auth.CurrentUserResponse;
import com.asterflow.erp.dto.auth.LoginRequest;
import com.asterflow.erp.dto.auth.LoginResponse;

public interface UserService {

    LoginResponse login(LoginRequest request);

    LoginResponse refresh(String refreshToken);

    void logout(String accessToken, String refreshToken);

    CurrentUserResponse currentUser(Long userId);
}