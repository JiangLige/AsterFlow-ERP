package com.demo.erp.interceptor;

import com.auth0.jwt.exceptions.JWTVerificationException;
import com.demo.erp.common.BusinessException;
import com.demo.erp.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class JwtInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;

    public JwtInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {
        String token = request.getHeader("Authorization");

        if (token == null || token.isBlank()) {
            throw new BusinessException("请先登录");
        }

        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        try {
            jwtUtil.verifyToken(token);

            Long userId = jwtUtil.getUserId(token);
            String username = jwtUtil.getUsername(token);
            String role = jwtUtil.getRole(token);

            request.setAttribute("userId", userId);
            request.setAttribute("username", username);
            request.setAttribute("role", role);
        } catch (JWTVerificationException e) {
            throw new BusinessException("登录已过期或无效，请重新登录");
        }

        return true;
    }
}