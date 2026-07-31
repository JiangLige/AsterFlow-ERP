package com.asterFlow.erp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.asterFlow.erp.common.BusinessException;
import com.asterFlow.erp.dto.auth.CurrentUserResponse;
import com.asterFlow.erp.dto.auth.LoginRequest;
import com.asterFlow.erp.dto.auth.LoginResponse;
import com.asterFlow.erp.enums.UserStatus;
import com.asterFlow.erp.mapper.UserMapper;
import com.asterFlow.erp.service.UserService;
import com.asterFlow.erp.util.JwtUtil;
import entity.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserServiceImpl(UserMapper userMapper, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
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

        LoginResponse response = new LoginResponse();

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());
        response.setToken(token);

        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setRealName(user.getRealName());
        response.setRole(user.getRole());

        return response;
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
}