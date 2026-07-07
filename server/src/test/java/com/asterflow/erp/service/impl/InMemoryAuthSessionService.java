package com.asterflow.erp.service.impl;

import com.asterflow.erp.dto.auth.AuthSession;
import com.asterflow.erp.service.AuthSessionService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@TestConfiguration
public class InMemoryAuthSessionService {

    @Bean
    @Primary
    AuthSessionService authSessionService() {
        return new AuthSessionService() {

            private final Map<String, AuthSession> sessions = new ConcurrentHashMap<>();
            private final Map<String, String> refreshTokens = new ConcurrentHashMap<>();

            @Override
            public AuthSession createSession(Long userId, String username, String role, String status) {
                AuthSession session = new AuthSession();
                session.setSessionId(UUID.randomUUID().toString());
                session.setRefreshToken(UUID.randomUUID().toString());
                session.setUserId(userId);
                session.setUsername(username);
                session.setRole(role);
                session.setStatus(status);

                sessions.put(session.getSessionId(), session);
                refreshTokens.put(session.getRefreshToken(), session.getSessionId());

                return session;
            }

            @Override
            public Optional<AuthSession> findBySessionId(String sessionId) {
                if (sessionId == null || sessionId.isBlank()) {
                    return Optional.empty();
                }

                return Optional.ofNullable(sessions.get(sessionId));
            }

            @Override
            public Optional<AuthSession> findByRefreshToken(String refreshToken) {
                if (refreshToken == null || refreshToken.isBlank()) {
                    return Optional.empty();
                }

                return findBySessionId(refreshTokens.get(refreshToken));
            }

            @Override
            public void invalidate(String sessionId, String refreshToken) {
                if (refreshToken != null && !refreshToken.isBlank()) {
                    refreshTokens.remove(refreshToken);
                }

                if (sessionId == null || sessionId.isBlank()) {
                    return;
                }

                AuthSession session = sessions.remove(sessionId);

                if (session != null && session.getRefreshToken() != null) {
                    refreshTokens.remove(session.getRefreshToken());
                }
            }
        };
    }
}
