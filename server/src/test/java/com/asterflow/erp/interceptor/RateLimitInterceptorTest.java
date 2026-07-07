package com.asterflow.erp.interceptor;

import com.asterflow.erp.common.BusinessException;
import com.asterflow.erp.common.ErrorCode;
import com.asterflow.erp.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RateLimitInterceptorTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private JwtUtil jwtUtil;

    @Test
    void shouldAllowRequestWhenCurrentCountIsUnderLimit() {
        RateLimitInterceptor interceptor = new RateLimitInterceptor(redisTemplate, jwtUtil, 60, 2, 5);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/products");
        request.setRemoteAddr("127.0.0.1");

        when(redisTemplate.execute(any(), anyList(), any())).thenReturn(1L);

        boolean allowed = interceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        assertThat(allowed).isTrue();
    }

    @Test
    void shouldRejectLoginRequestWhenCurrentCountExceedsLoginLimit() {
        RateLimitInterceptor interceptor = new RateLimitInterceptor(redisTemplate, jwtUtil, 60, 2, 5);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("127.0.0.1");

        when(redisTemplate.execute(any(), anyList(), any())).thenReturn(3L);

        assertThatThrownBy(() ->
                interceptor.preHandle(request, new MockHttpServletResponse(), new Object())
        )
                .isInstanceOfSatisfying(BusinessException.class, ex ->
                        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.TOO_MANY_REQUESTS)
                )
                .hasMessageContaining("请求过于频繁");
    }

    @Test
    void shouldRejectApiRequestWhenCurrentCountExceedsApiLimit() {
        RateLimitInterceptor interceptor = new RateLimitInterceptor(redisTemplate, jwtUtil, 60, 2, 5);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/products");
        request.setRemoteAddr("127.0.0.1");

        when(redisTemplate.execute(any(), anyList(), any())).thenReturn(6L);

        assertThatThrownBy(() ->
                interceptor.preHandle(request, new MockHttpServletResponse(), new Object())
        )
                .isInstanceOfSatisfying(BusinessException.class, ex ->
                        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.TOO_MANY_REQUESTS)
                );
    }

    @Test
    void shouldAllowRequestWhenRedisFails() {
        RateLimitInterceptor interceptor = new RateLimitInterceptor(redisTemplate, jwtUtil, 60, 2, 5);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/products");
        request.setRemoteAddr("127.0.0.1");

        when(redisTemplate.execute(any(), anyList(), any())).thenThrow(new RuntimeException("redis down"));

        boolean allowed = interceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        assertThat(allowed).isTrue();
    }
}