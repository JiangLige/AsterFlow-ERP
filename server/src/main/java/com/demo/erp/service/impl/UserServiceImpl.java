package com.demo.erp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.demo.erp.common.BusinessException;
import com.demo.erp.common.ErrorCode;
import com.demo.erp.dto.auth.AuthSession;
import com.demo.erp.dto.auth.CurrentUserResponse;
import com.demo.erp.dto.auth.LoginRequest;
import com.demo.erp.dto.auth.LoginResponse;
import com.demo.erp.enums.UserStatus;
import com.demo.erp.mapper.UserMapper;
import com.demo.erp.service.AuthSessionService;
import com.demo.erp.service.UserService;
import com.demo.erp.util.JwtUtil;
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
            throw new BusinessException("账号已停用");
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

        return buildLoginResponse(user, session);
    }

    @Override
    public LoginResponse refresh(String refreshToken) {
        AuthSession session = authSessionService.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "鐧诲綍宸茶繃鏈熸垨鏃犳晥锛岃閲嶆柊鐧诲綍"));

        User user = userMapper.selectById(session.getUserId());

        if (user == null || !UserStatus.ACTIVE.name().equals(user.getStatus())) {
            authSessionService.invalidate(session.getSessionId(), refreshToken);
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "鐧诲綍宸茶繃鏈熸垨鏃犳晥锛岃閲嶆柊鐧诲綍");
        }

        return buildLoginResponse(user, session);
    }

    @Override
    public void logout(String accessToken, String refreshToken) {
        String sessionId = null;

        String token = normalizeBearerToken(accessToken);

        if (token != null && !token.isBlank()) {
            try {
                sessionId = jwtUtil.getSessionId(token);
            } catch (JWTVerificationException | IllegalArgumentException ignored) {
                sessionId = null;
            }
        }

        if ((sessionId == null || sessionId.isBlank()) && refreshToken != null && !refreshToken.isBlank()) {
            sessionId = authSessionService.findByRefreshToken(refreshToken)
                    .map(AuthSession::getSessionId)
                    .orElse(null);
        }

        authSessionService.invalidate(sessionId, refreshToken);
    }

    @Override
    public CurrentUserResponse currentUser(Long userId) {
        User user = userMapper.selectById(userId);

        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        CurrentUserResponse response = new CurrentUserResponse();
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setRealName(user.getRealName());
        response.setRole(user.getRole());

        return response;
    }

    private LoginResponse buildLoginResponse(User user, AuthSession session) {
        String accessToken = jwtUtil.generateAccessToken(
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

    private String normalizeBearerToken(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            return null;
        }

        if (accessToken.startsWith("Bearer ")) {
            return accessToken.substring(7);
        }

        return accessToken;
    }
}
