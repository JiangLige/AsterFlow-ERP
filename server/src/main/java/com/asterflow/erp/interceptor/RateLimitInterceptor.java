package com.asterflow.erp.interceptor;

import com.asterflow.erp.common.BusinessException;
import com.asterflow.erp.common.ErrorCode;
import com.asterflow.erp.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.List;

@Component
@ConditionalOnProperty(name = "erp.rate-limit.enabled", havingValue = "true")
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(RateLimitInterceptor.class);

    private final StringRedisTemplate redisTemplate;
    private final JwtUtil jwtUtil;
    private final DefaultRedisScript<Long> script;
    private final long windowSeconds;
    private final long loginLimit;
    private final long apiLimit;

    public RateLimitInterceptor(StringRedisTemplate redisTemplate,
                                JwtUtil jwtUtil,
                                @Value("${erp.rate-limit.window-seconds:60}") long windowSeconds,
                                @Value("${erp.rate-limit.login-limit:10}") long loginLimit,
                                @Value("${erp.rate-limit.api-limit:120}") long apiLimit) {
        this.redisTemplate = redisTemplate;
        this.jwtUtil = jwtUtil;
        this.windowSeconds = windowSeconds;
        this.loginLimit = loginLimit;
        this.apiLimit = apiLimit;
        this.script = new DefaultRedisScript<>("""
                local current = redis.call('INCR', KEYS[1])
                if current == 1 then
                    redis.call('EXPIRE', KEYS[1], ARGV[1])
                end
                return current
                """, Long.class);
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {
        String uri = request.getRequestURI();
        boolean loginRequest = "/api/auth/login".equals(uri);

        long limit = loginRequest ? loginLimit : apiLimit;
        String identity = loginRequest ? "ip:" + clientIp(request) : userOrIp(request);
        String key = "asterflow-erp:rate-limit:" + (loginRequest ? "login:" : "api:") + identity;

        try {
            Long current = redisTemplate.execute(script, List.of(key), String.valueOf(windowSeconds));

            if (current != null && current > limit) {
                throw new BusinessException(ErrorCode.TOO_MANY_REQUESTS, "请求过于频繁，请稍后再试");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Redis rate limit failed, request allowed. key={}", key, e);
        }

        return true;
    }

    private String userOrIp(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");

        if (authorization != null && authorization.startsWith("Bearer ")) {
            try {
                return "user:" + jwtUtil.getUserId(authorization.substring(7));
            } catch (Exception ignored) {
                return "ip:" + clientIp(request);
            }
        }

        return "ip:" + clientIp(request);
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }
}