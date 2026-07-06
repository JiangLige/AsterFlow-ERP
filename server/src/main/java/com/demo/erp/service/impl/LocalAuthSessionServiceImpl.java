package com.demo.erp.service.impl;

import com.demo.erp.dto.auth.AuthSession;
import com.demo.erp.service.AuthSessionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@ConditionalOnProperty(name = "erp.auth.session-store", havingValue = "local", matchIfMissing = true)
public class LocalAuthSessionServiceImpl implements AuthSessionService {

    private final Map<String, LocalSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, String> refreshTokens = new ConcurrentHashMap<>();
    private final Duration ttl;

    public LocalAuthSessionServiceImpl(@Value("${jwt.refresh-token-expire-days:7}") long refreshTokenExpireDays) {
        this.ttl = Duration.ofDays(refreshTokenExpireDays);
    }

    @Override
    public AuthSession createSession(Long userId, String username, String role, String status) {
        cleanupExpiredSessions();

        AuthSession session = new AuthSession();
        session.setSessionId(UUID.randomUUID().toString());
        session.setRefreshToken(UUID.randomUUID().toString());
        session.setUserId(userId);
        session.setUsername(username);
        session.setRole(role);
        session.setStatus(status);

        Instant expireAt = Instant.now().plus(ttl);
        sessions.put(session.getSessionId(), new LocalSession(session, expireAt));
        refreshTokens.put(session.getRefreshToken(), session.getSessionId());

        return session;
    }

    @Override
    public Optional<AuthSession> findBySessionId(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return Optional.empty();
        }

        LocalSession localSession = sessions.get(sessionId);

        if (localSession == null) {
            return Optional.empty();
        }

        if (localSession.expireAt().isBefore(Instant.now())) {
            invalidate(sessionId, localSession.session().getRefreshToken());
            return Optional.empty();
        }

        return Optional.of(localSession.session());
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

        LocalSession removed = sessions.remove(sessionId);

        if (removed != null && removed.session().getRefreshToken() != null) {
            refreshTokens.remove(removed.session().getRefreshToken());
        }
    }

    private void cleanupExpiredSessions() {
        Instant now = Instant.now();

        sessions.entrySet().removeIf(entry -> {
            boolean expired = entry.getValue().expireAt().isBefore(now);
            if (expired) {
                refreshTokens.remove(entry.getValue().session().getRefreshToken());
            }
            return expired;
        });
    }

    private record LocalSession(AuthSession session, Instant expireAt) {
    }
}