package com.asterflow.erp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.asterflow.erp.common.BusinessException;
import com.asterflow.erp.dto.auth.AuthSession;
import com.asterflow.erp.dto.auth.CurrentUserResponse;
import com.asterflow.erp.dto.auth.LoginRequest;
import com.asterflow.erp.dto.auth.LoginResponse;
import com.asterflow.erp.enums.UserStatus;
import com.asterflow.erp.mapper.UserMapper;
import com.asterflow.erp.service.AuthSessionService;
import com.asterflow.erp.service.UserService;
import com.asterflow.erp.util.JwtUtil;
import entity.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthSessionService authSessionService;

    public UserServiceImpl(UserMapper userMapper,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil,
                           AuthSessionService authSessionService) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authSessionService = authSessionService;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                        .eq(User::getUsername, request.getUsername())
        );

        if (user == null) {
            throw new BusinessException("用户名或密码错误");
        }

        if (!UserStatus.ACTIVE.name().equals(user.getStatus())) {
            throw new BusinessException("账号已停");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }

        AuthSession session = authSessionService.createSession(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.getStatus()
        );

        String accessToken = jwtUtil.generateToken(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                session.getSessionId()
        );

        LoginResponse response = new LoginResponse();
        response.setToken(accessToken);
        response.setAccessToken(accessToken);
        response.setRefreshToken(session.getRefreshToken());
        response.setExpiresInSeconds(jwtUtil.getAccessTokenExpiresInSeconds());
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setRealName(user.getRealName());
        response.setRole(user.getRole());

        return response;
    }

    @Override
    public LoginResponse refresh(String refreshToken) {
        AuthSession session = authSessionService.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new BusinessException("登录已过期，请重新登"));

        if (!UserStatus.ACTIVE.name().equals(session.getStatus())) {
            throw new BusinessException("账号已停");
        }

        String accessToken = jwtUtil.generateToken(
                session.getUserId(),
                session.getUsername(),
                session.getRole(),
                session.getSessionId()
        );

        LoginResponse response = new LoginResponse();
        response.setToken(accessToken);
        response.setAccessToken(accessToken);
        response.setRefreshToken(session.getRefreshToken());
        response.setExpiresInSeconds(jwtUtil.getAccessTokenExpiresInSeconds());
        response.setUserId(session.getUserId());
        response.setUsername(session.getUsername());
        response.setRole(session.getRole());

        return response;
    }

    @Override
    public void logout(String accessToken, String refreshToken) {
        String sessionId = null;

        if (accessToken != null && !accessToken.isBlank()) {
            String token = accessToken.startsWith("Bearer ")
                    ? accessToken.substring(7)
                    : accessToken;
            sessionId = jwtUtil.getSessionId(token);
        }

        authSessionService.invalidate(sessionId, refreshToken);
    }

    @Override
    public CurrentUserResponse currentUser(Long userId) {
        User user = userMapper.selectById(userId);

        if (user == null) {
            throw new BusinessException("用户不存");
        }

        CurrentUserResponse response = new CurrentUserResponse();
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setRealName(user.getRealName());
        response.setRole(user.getRole());

        return response;
    }
}