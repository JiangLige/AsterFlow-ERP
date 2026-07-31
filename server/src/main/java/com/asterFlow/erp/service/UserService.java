package com.asterFlow.erp.service;

import com.asterFlow.erp.dto.auth.CurrentUserResponse;
import com.asterFlow.erp.dto.auth.LoginRequest;
import com.asterFlow.erp.dto.auth.LoginResponse;

public interface UserService {

    LoginResponse login(LoginRequest request);

    CurrentUserResponse currentUser(Long userId);
}