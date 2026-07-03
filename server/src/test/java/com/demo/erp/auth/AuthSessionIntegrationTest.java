package com.demo.erp.auth;

import com.demo.erp.common.ApiResponse;
import com.demo.erp.dto.auth.LoginRequest;
import com.demo.erp.dto.auth.LoginResponse;
import com.demo.erp.service.impl.InMemoryAuthSessionService;
import com.demo.erp.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(InMemoryAuthSessionService.class)
class AuthSessionIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtUtil jwtUtil;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Test
    void loginCreatesAccessAndRefreshTokensWithSessionId() {
        LoginResponse login = login();

        assertThat(login.getAccessToken()).isNotBlank();
        assertThat(login.getToken()).isEqualTo(login.getAccessToken());
        assertThat(login.getRefreshToken()).isNotBlank();
        assertThat(login.getExpiresInSeconds()).isPositive();
        assertThat(jwtUtil.getSessionId(login.getAccessToken())).isNotBlank();
    }

    @Test
    void refreshReturnsNewAccessTokenForActiveSession() {
        LoginResponse login = login();

        HttpResponse<String> response = postJson(
                "/api/auth/refresh",
                new RefreshBody(login.getRefreshToken()),
                null
        );

        assertThat(response.statusCode()).isEqualTo(200);
        Map<String, Object> data = responseData(response);
        assertThat((String) data.get("accessToken")).isNotBlank();
        assertThat((String) data.get("refreshToken")).isEqualTo(login.getRefreshToken());
    }

    @Test
    void logoutRevokesExistingAccessToken() {
        LoginResponse login = login();

        postJson(
                "/api/auth/logout",
                new RefreshBody(login.getRefreshToken()),
                login.getAccessToken()
        );

        HttpRequest meRequest = HttpRequest.newBuilder()
                .uri(uri("/api/auth/me"))
                .header("Authorization", "Bearer " + login.getAccessToken())
                .GET()
                .build();
        HttpResponse<String> me = send(meRequest);

        assertThat(me.statusCode()).isEqualTo(401);
    }

    private LoginResponse login() {
        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("admin123");

        HttpResponse<String> response = postJson("/api/auth/login", request, null);

        assertThat(response.statusCode()).isEqualTo(200);
        Map<String, Object> data = responseData(response);

        LoginResponse login = new LoginResponse();
        login.setToken((String) data.get("token"));
        login.setAccessToken((String) data.get("accessToken"));
        login.setRefreshToken((String) data.get("refreshToken"));
        login.setExpiresInSeconds(((Number) data.get("expiresInSeconds")).longValue());
        login.setUserId(((Number) data.get("userId")).longValue());
        login.setUsername((String) data.get("username"));
        login.setRealName((String) data.get("realName"));
        login.setRole((String) data.get("role"));

        return login;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> responseData(HttpResponse<String> response) {
        try {
            Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
            assertThat(body.get("data")).isInstanceOf(Map.class);
            return (Map<String, Object>) body.get("data");
        } catch (Exception e) {
            throw new AssertionError("Failed to parse API response: " + response.body(), e);
        }
    }

    private HttpResponse<String> postJson(String path, Object body, String accessToken) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(uri(path))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)));

            if (accessToken != null && !accessToken.isBlank()) {
                builder.header("Authorization", "Bearer " + accessToken);
            }

            return send(builder.build());
        } catch (Exception e) {
            throw new AssertionError("Failed to send request", e);
        }
    }

    private HttpResponse<String> send(HttpRequest request) {
        try {
            return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            throw new AssertionError("HTTP request failed", e);
        }
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }

    record RefreshBody(String refreshToken) {
    }
}
