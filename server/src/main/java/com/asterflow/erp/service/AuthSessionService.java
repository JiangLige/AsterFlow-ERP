package com.asterflow.erp.service;

import com.asterflow.erp.dto.auth.AuthSession;
import com.asterflow.erp.common.EnumValidator;
import com.asterflow.erp.enums.CustomerStatus;

import java.util.Optional;

public interface AuthSessionService {

    AuthSession createSession(Long userId, String username, String role, String status);

    Optional<AuthSession> findBySessionId(String sessionId);

    Optional<AuthSession> findByRefreshToken(String refreshToken);

    void invalidate(String sessionId, String refreshToken);
}
