package com.asterflow.erp.util;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expire-minutes:30}")
    private Long accessTokenExpireMinutes;

    public String generateToken(Long userId, String username, String role, String sessionId) {
        Instant now = Instant.now();

        return JWT.create()
                .withSubject(String.valueOf(userId))
                .withClaim("username", username)
                .withClaim("role", role)
                .withClaim("sessionId", sessionId)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(now.plus(accessTokenExpireMinutes, ChronoUnit.MINUTES)))
                .sign(Algorithm.HMAC256(secret));
    }

    public String generateToken(Long userId, String username, String role) {
        return generateToken(userId, username, role, null);
    }

    public DecodedJWT verifyToken(String token) {
        return JWT.require(Algorithm.HMAC256(secret))
                .build()
                .verify(token);
    }

    public Long getUserId(String token) {
        DecodedJWT jwt = verifyToken(token);
        return Long.valueOf(jwt.getSubject());
    }

    public String getUsername(String token) {
        DecodedJWT jwt = verifyToken(token);
        return jwt.getClaim("username").asString();
    }

    public String getRole(String token) {
        DecodedJWT jwt = verifyToken(token);
        return jwt.getClaim("role").asString();
    }

    public String getSessionId(String token) {
        DecodedJWT jwt = verifyToken(token);
        return jwt.getClaim("sessionId").asString();
    }

    public Long getAccessTokenExpiresInSeconds() {
        return accessTokenExpireMinutes * 60;
    }
}