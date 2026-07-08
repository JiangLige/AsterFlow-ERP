package com.asterflow.erp.controller;

import com.asterflow.erp.dto.auth.LoginRequest;
import com.asterflow.erp.dto.auth.LoginResponse;
import com.asterflow.erp.entity.User;
import com.asterflow.erp.enums.UserRole;
import com.asterflow.erp.enums.UserStatus;
import com.asterflow.erp.mapper.UserMapper;
import com.asterflow.erp.service.impl.InMemoryAuthSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(InMemoryAuthSessionService.class)
class ApiSecurityIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @BeforeEach
    void cleanDatabase() {
        jdbcTemplate.execute("DELETE FROM t_product");
        jdbcTemplate.execute("DELETE FROM t_user WHERE username = 'staff'");
    }

    @Test
    void protectedEndpointRejectsMissingJwt() {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(uri("/api/products"))
                .GET()
                .build();

        HttpResponse<String> response = send(request);

        assertThat(response.statusCode()).isEqualTo(401);
        assertThat(responseCode(response)).isEqualTo("UNAUTHORIZED");
    }

    @Test
    void staffUserCannotDeleteProduct() {
        String token = loginAsStaff().getAccessToken();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(uri("/api/products/1"))
                .header("Authorization", "Bearer " + token)
                .DELETE()
                .build();

        HttpResponse<String> response = send(request);

        assertThat(response.statusCode()).isEqualTo(403);
        assertThat(responseCode(response)).isEqualTo("FORBIDDEN");
    }

    @Test
    void invalidProductRequestReturnsValidationError() {
        String token = loginAsAdmin().getAccessToken();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(uri("/api/products"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .POST(HttpRequest.BodyPublishers.ofString("{}"))
                .build();

        HttpResponse<String> response = send(request);

        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(responseCode(response)).isEqualTo("VALIDATION_ERROR");
    }

    private LoginResponse loginAsAdmin() {
        return login("admin", "admin123");
    }

    private LoginResponse loginAsStaff() {
        User user = new User();
        user.setUsername("staff");
        user.setPassword(passwordEncoder.encode("user123"));
        user.setRealName("Staff User");
        user.setRole(UserRole.STAFF.name());
        user.setStatus(UserStatus.ACTIVE.name());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setDeleted(0);
        user.setVersion(0);
        userMapper.insert(user);

        return login("staff", "user123");
    }

    private LoginResponse login(String username, String password) {
        LoginRequest request = new LoginRequest();
        request.setUsername(username);
        request.setPassword(password);

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

    @SuppressWarnings("unchecked")
    private String responseCode(HttpResponse<String> response) {
        try {
            Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
            return (String) body.get("code");
        } catch (Exception e) {
            throw new AssertionError("Failed to parse API response: " + response.body(), e);
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
}
