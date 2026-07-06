package com.demo.erp.interceptor;

import com.auth0.jwt.exceptions.JWTVerificationException;
import com.demo.erp.common.BusinessException;
import com.demo.erp.common.ErrorCode;
import com.demo.erp.dto.auth.AuthSession;
import com.demo.erp.service.AuthSessionService;
import com.demo.erp.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class JwtInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;
    private final AuthSessionService authSessionService;

    public JwtInterceptor(JwtUtil jwtUtil, AuthSessionService authSessionService) {
        this.jwtUtil = jwtUtil;
        this.authSessionService = authSessionService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {
        String token = request.getHeader("Authorization");

        if (token == null || token.isBlank()) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "请先登录");
        }

        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        try {
            jwtUtil.verifyToken(token);

            String sessionId = jwtUtil.getSessionId(token);
            AuthSession session = authSessionService.findBySessionId(sessionId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "登录已失效，请重新登录"));

            request.setAttribute("userId", session.getUserId());
            request.setAttribute("username", session.getUsername());
            request.setAttribute("role", session.getRole());
        } catch (JWTVerificationException e) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "登录已过期或无效，请重新登录");
        }

        return true;
    }
}