package com.demo.erp.service;

import com.demo.erp.dto.auth.AuthSession;

import java.util.Optional;

public interface AuthSessionService {

    AuthSession createSession(Long userId, String username, String role, String status);

    Optional<AuthSession> findBySessionId(String sessionId);

    Optional<AuthSession> findByRefreshToken(String refreshToken);

    void invalidate(String sessionId, String refreshToken);
}
