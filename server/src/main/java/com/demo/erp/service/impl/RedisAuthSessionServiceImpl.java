package com.demo.erp.service.impl;

import com.demo.erp.dto.auth.AuthSession;
import com.demo.erp.service.AuthSessionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "erp.auth.session-store", havingValue = "redis")
public class RedisAuthSessionServiceImpl implements AuthSessionService {

    private static final String SESSION_KEY_PREFIX = "asterflow-erp:auth:session:";
    private static final String REFRESH_KEY_PREFIX = "asterflow-erp:auth:refresh:";

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration sessionTtl;

    public RedisAuthSessionServiceImpl(StringRedisTemplate stringRedisTemplate,
                                       ObjectMapper objectMapper,
                                       @Value("${jwt.refresh-token-expire-days:7}") long refreshTokenExpireDays) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.objectMapper = objectMapper;
        this.sessionTtl = Duration.ofDays(refreshTokenExpireDays);
    }

    @Override
    public AuthSession createSession(Long userId, String username, String role, String status) {
        AuthSession session = new AuthSession();
        session.setSessionId(UUID.randomUUID().toString());
        session.setRefreshToken(UUID.randomUUID().toString());
        session.setUserId(userId);
        session.setUsername(username);
        session.setRole(role);
        session.setStatus(status);

        try {
            stringRedisTemplate.opsForValue().set(
                    sessionKey(session.getSessionId()),
                    objectMapper.writeValueAsString(session),
                    sessionTtl
            );
            stringRedisTemplate.opsForValue().set(
                    refreshKey(session.getRefreshToken()),
                    session.getSessionId(),
                    sessionTtl
            );
        } catch (Exception e) {
            throw new IllegalStateException("Failed to create auth session", e);
        }

        return session;
    }

    @Override
    public Optional<AuthSession> findBySessionId(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return Optional.empty();
        }

        String json = stringRedisTemplate.opsForValue().get(sessionKey(sessionId));

        if (json == null || json.isBlank()) {
            return Optional.empty();
        }

        try {
            return Optional.of(objectMapper.readValue(json, AuthSession.class));
        } catch (Exception e) {
            stringRedisTemplate.delete(sessionKey(sessionId));
            return Optional.empty();
        }
    }

    @Override
    public Optional<AuthSession> findByRefreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return Optional.empty();
        }

        String sessionId = stringRedisTemplate.opsForValue().get(refreshKey(refreshToken));
        return findBySessionId(sessionId);
    }

    @Override
    public void invalidate(String sessionId, String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            stringRedisTemplate.delete(refreshKey(refreshToken));
        }

        if (sessionId == null || sessionId.isBlank()) {
            return;
        }

        findBySessionId(sessionId)
                .map(AuthSession::getRefreshToken)
                .filter(token -> token != null && !token.isBlank())
                .ifPresent(token -> stringRedisTemplate.delete(refreshKey(token)));

        stringRedisTemplate.delete(sessionKey(sessionId));
    }

    private String sessionKey(String sessionId) {
        return SESSION_KEY_PREFIX + sessionId;
    }

    private String refreshKey(String refreshToken) {
        return REFRESH_KEY_PREFIX + refreshToken;
    }
}
