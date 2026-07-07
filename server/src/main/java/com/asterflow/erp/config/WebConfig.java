package com.asterflow.erp.config;

import com.asterflow.erp.interceptor.JwtInterceptor;
import com.asterflow.erp.interceptor.RateLimitInterceptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final JwtInterceptor jwtInterceptor;
    private final ObjectProvider<RateLimitInterceptor> rateLimitInterceptorProvider;

    public WebConfig(JwtInterceptor jwtInterceptor, ObjectProvider<RateLimitInterceptor> rateLimitInterceptorProvider) {
        this.jwtInterceptor = jwtInterceptor;
        this.rateLimitInterceptorProvider = rateLimitInterceptorProvider;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {

        rateLimitInterceptorProvider.ifAvailable(rateLimitInterceptor ->
                registry.addInterceptor(rateLimitInterceptor)
                        .addPathPatterns("/api/**")
                        .excludePathPatterns(
                                "/api/health",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/swagger-ui.html",
                                "/swagger-ui/**"
                        )
                        .order(0)

        );

        registry.addInterceptor(jwtInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        "/api/auth/login",
                        "/api/health",
                        "/v3/api-docs",
                        "/v3/api-docs/**",
                        "/swagger-ui.html",
                        "/swagger-ui/**",
                        "/api/auth/refresh"
                )
                .order(1);
    }
}
