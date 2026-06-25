package com.demo.erp.service;

import com.demo.erp.dto.auth.CurrentUserResponse;
import com.demo.erp.dto.auth.LoginRequest;
import com.demo.erp.dto.auth.LoginResponse;

public interface UserService {

    LoginResponse login(LoginRequest request);

    CurrentUserResponse currentUser(Long userId);
}