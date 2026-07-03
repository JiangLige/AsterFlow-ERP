# Auth Session Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Redis-backed session state, refresh tokens, and server-side logout to the existing JWT authentication flow.

**Architecture:** Keep the current Spring MVC `JwtInterceptor` and extend it with Redis session validation. Login creates a short-lived JWT access token plus an opaque refresh token; Redis owns refresh/session validity so logout and disabled sessions take effect server-side.

**Tech Stack:** Spring Boot 4, Spring Web MVC, MyBatis Plus, `StringRedisTemplate`, Auth0 `java-jwt`, Next.js API proxy, React localStorage compatibility.

## Global Constraints

- Do not replace MVC interceptors with a full Spring Security filter chain in this slice.
- Keep `token` in login responses temporarily for frontend compatibility.
- Add `accessToken`, `refreshToken`, and `expiresInSeconds` to login/refresh responses.
- Access token default lifetime: 30 minutes.
- Refresh session default lifetime: 7 days.
- Refresh tokens are opaque random values, not JWTs.
- Protected requests must verify both JWT validity and Redis session validity.
- No secrets or real tokens should be logged.
- Keep the current frontend localStorage model in this slice; httpOnly cookie migration is a later slice.
- Do not touch `.idea/data_source_mapping.xml`.

---

## File Structure

- Modify `server/src/main/resources/application.yml`: add `jwt.access-token-expire-minutes` and `jwt.refresh-token-expire-days` while keeping current `jwt.expire-hours` compatibility if needed.
- Modify `server/src/test/resources/application.yml`: add short, deterministic auth session settings for tests.
- Create `server/src/main/java/com/demo/erp/dto/auth/RefreshTokenRequest.java`: request body for refresh/logout.
- Modify `server/src/main/java/com/demo/erp/dto/auth/LoginResponse.java`: add `accessToken`, `refreshToken`, and `expiresInSeconds`.
- Create `server/src/main/java/com/demo/erp/dto/auth/AuthSession.java`: internal session snapshot used by Redis session service and interceptor.
- Create `server/src/main/java/com/demo/erp/service/AuthSessionService.java`: interface for session creation, lookup, refresh lookup, and invalidation.
- Create `server/src/main/java/com/demo/erp/service/impl/RedisAuthSessionServiceImpl.java`: Redis implementation using `StringRedisTemplate`.
- Modify `server/src/main/java/com/demo/erp/util/JwtUtil.java`: include `sessionId`, configurable expiration seconds, and claim readers.
- Modify `server/src/main/java/com/demo/erp/service/UserService.java`: add `refresh(String refreshToken)` and `logout(String accessToken, String refreshToken)`.
- Modify `server/src/main/java/com/demo/erp/service/impl/UserServiceImpl.java`: create sessions on login, issue access tokens with `sessionId`, refresh tokens, and invalidate sessions on logout.
- Modify `server/src/main/java/com/demo/erp/interceptor/JwtInterceptor.java`: verify JWT, extract session id, validate Redis session, then set request attributes from Redis session.
- Modify `server/src/main/java/com/demo/erp/controller/AuthController.java`: add `/refresh` and `/logout`.
- Create `server/src/test/java/com/demo/erp/service/impl/InMemoryAuthSessionService.java`: test double for service/interceptor tests where Redis is not needed.
- Create `server/src/test/java/com/demo/erp/auth/AuthSessionIntegrationTest.java`: end-to-end auth behavior tests.
- Create `client/src/pages/api/auth/refresh.ts`: Next proxy route to backend refresh endpoint.
- Create `client/src/pages/api/auth/logout.ts`: Next proxy route to backend logout endpoint.
- Modify `client/src/pages/login.tsx`: store `accessToken` and `refreshToken`.
- Modify `client/src/lib/api.ts`: attempt one refresh on `UNAUTHORIZED`, then retry original request.
- Modify `client/src/components/Layout.tsx`: call logout endpoint before clearing local storage.

---

### Task 1: Backend Auth Session Contract And Failing Tests

**Files:**
- Create: `server/src/test/java/com/demo/erp/auth/AuthSessionIntegrationTest.java`
- Create: `server/src/test/java/com/demo/erp/service/impl/InMemoryAuthSessionService.java`

**Interfaces:**
- Produces test expectations for:
  - `LoginResponse.getAccessToken()`
  - `LoginResponse.getRefreshToken()`
  - `LoginResponse.getExpiresInSeconds()`
  - `JwtUtil.getSessionId(String token)`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`

- [ ] **Step 1: Write failing tests**

Create `AuthSessionIntegrationTest` with these test cases:

```java
package com.demo.erp.auth;

import com.demo.erp.common.ApiResponse;
import com.demo.erp.dto.auth.LoginRequest;
import com.demo.erp.dto.auth.LoginResponse;
import com.demo.erp.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AuthSessionIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JwtUtil jwtUtil;

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

        ResponseEntity<ApiResponse> response = restTemplate.postForEntity(
                url("/api/auth/refresh"),
                new RefreshBody(login.getRefreshToken()),
                ApiResponse.class
        );

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        Map<String, Object> data = responseData(response);
        assertThat((String) data.get("accessToken")).isNotBlank();
        assertThat((String) data.get("refreshToken")).isEqualTo(login.getRefreshToken());
    }

    @Test
    void logoutRevokesExistingAccessToken() {
        LoginResponse login = login();

        HttpHeaders logoutHeaders = new HttpHeaders();
        logoutHeaders.setBearerAuth(login.getAccessToken());
        restTemplate.postForEntity(
                url("/api/auth/logout"),
                new HttpEntity<>(new RefreshBody(login.getRefreshToken()), logoutHeaders),
                ApiResponse.class
        );

        HttpHeaders meHeaders = new HttpHeaders();
        meHeaders.setBearerAuth(login.getAccessToken());
        ResponseEntity<ApiResponse> me = restTemplate.exchange(
                url("/api/auth/me"),
                HttpMethod.GET,
                new HttpEntity<>(meHeaders),
                ApiResponse.class
        );

        assertThat(me.getStatusCode().value()).isEqualTo(401);
    }

    private LoginResponse login() {
        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("admin123");

        ResponseEntity<ApiResponse> response = restTemplate.postForEntity(
                url("/api/auth/login"),
                request,
                ApiResponse.class
        );

        assertThat(response.getStatusCode().value()).isEqualTo(200);
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
    private Map<String, Object> responseData(ResponseEntity<ApiResponse> response) {
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).isInstanceOf(Map.class);
        return (Map<String, Object>) response.getBody().getData();
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    record RefreshBody(String refreshToken) {
    }
}
```

The test must fail because the new fields and endpoints do not exist.

- [ ] **Step 2: Run failing test**

Run: `cd server && .\mvnw.cmd -Dtest=AuthSessionIntegrationTest test`

Expected: compilation fails for missing DTO fields/endpoints/helper pieces.

- [ ] **Step 3: Commit only test scaffolding after it reaches a meaningful RED state**

Commit message: `test: describe auth session behavior`

---

### Task 2: Backend Session Service And JWT Session Claim

**Files:**
- Create: `server/src/main/java/com/demo/erp/dto/auth/AuthSession.java`
- Create: `server/src/main/java/com/demo/erp/service/AuthSessionService.java`
- Create: `server/src/main/java/com/demo/erp/service/impl/RedisAuthSessionServiceImpl.java`
- Modify: `server/src/main/java/com/demo/erp/util/JwtUtil.java`
- Modify: `server/src/main/resources/application.yml`
- Modify: `server/src/test/resources/application.yml`

**Interfaces:**
- `AuthSessionService.createSession(Long userId, String username, String role, String status): AuthSession`
- `AuthSessionService.findBySessionId(String sessionId): Optional<AuthSession>`
- `AuthSessionService.findByRefreshToken(String refreshToken): Optional<AuthSession>`
- `AuthSessionService.invalidate(String sessionId, String refreshToken): void`
- `JwtUtil.generateAccessToken(Long userId, String username, String role, String sessionId): String`
- `JwtUtil.getSessionId(String token): String`
- `JwtUtil.getAccessTokenExpiresInSeconds(): long`

- [ ] **Step 1: Implement minimal session service and JWT claim support**

Use `UUID.randomUUID()` for `sessionId` and refresh token. Store session JSON with a 7-day TTL and refresh-token mapping with the same TTL.

- [ ] **Step 2: Run focused tests**

Run: `cd server && .\mvnw.cmd -Dtest=AuthSessionIntegrationTest test`

Expected: failures move from missing types to login/refresh/logout behavior.

- [ ] **Step 3: Commit**

Commit message: `feat: add redis auth session service`

---

### Task 3: Login, Refresh, Logout, And Interceptor Enforcement

**Files:**
- Create: `server/src/main/java/com/demo/erp/dto/auth/RefreshTokenRequest.java`
- Modify: `server/src/main/java/com/demo/erp/dto/auth/LoginResponse.java`
- Modify: `server/src/main/java/com/demo/erp/service/UserService.java`
- Modify: `server/src/main/java/com/demo/erp/service/impl/UserServiceImpl.java`
- Modify: `server/src/main/java/com/demo/erp/controller/AuthController.java`
- Modify: `server/src/main/java/com/demo/erp/interceptor/JwtInterceptor.java`

**Interfaces:**
- `UserService.refresh(String refreshToken): LoginResponse`
- `UserService.logout(String accessToken, String refreshToken): void`
- `RefreshTokenRequest.getRefreshToken(): String`
- `LoginResponse.getAccessToken(): String`
- `LoginResponse.getRefreshToken(): String`
- `LoginResponse.getExpiresInSeconds(): long`

- [ ] **Step 1: Implement minimal production code for the failing tests**

Login must create a Redis session, generate an access token containing `sessionId`, and return both token fields.

Refresh must look up the refresh token, verify the current user still exists and is active, then return a new access token for the same session.

Logout must extract the bearer token, read `sessionId`, and invalidate both the session and refresh token mapping. Missing/unknown sessions should return success.

The interceptor must reject a JWT if its `sessionId` claim is missing or no active Redis session exists.

- [ ] **Step 2: Run focused tests**

Run: `cd server && .\mvnw.cmd -Dtest=AuthSessionIntegrationTest test`

Expected: all auth session integration tests pass.

- [ ] **Step 3: Run backend suite**

Run: `npm run build:server`

Expected: Maven build success, all tests pass.

- [ ] **Step 4: Commit**

Commit message: `feat: enforce redis-backed auth sessions`

---

### Task 4: Frontend Refresh And Logout Integration

**Files:**
- Create: `client/src/pages/api/auth/refresh.ts`
- Create: `client/src/pages/api/auth/logout.ts`
- Modify: `client/src/pages/login.tsx`
- Modify: `client/src/lib/api.ts`
- Modify: `client/src/components/Layout.tsx`

**Interfaces:**
- `localStorage.accessToken`: preferred access token key.
- `localStorage.refreshToken`: refresh token key.
- Keep reading/writing `localStorage.token` until a later cleanup slice.

- [ ] **Step 1: Update login storage**

After login, store:

```ts
const accessToken = result.data.accessToken || result.data.token;
localStorage.setItem('token', accessToken);
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', result.data.refreshToken || '');
```

- [ ] **Step 2: Add refresh retry in `apiRequest`**

On one `UNAUTHORIZED` response, call `/api/auth/refresh` with `refreshToken`, update token storage, then retry the original request once.

- [ ] **Step 3: Add logout proxy and server logout call**

`Layout.handleLogout` should call `/api/auth/logout` with bearer access token and refresh token, then clear local storage regardless of response.

- [ ] **Step 4: Run frontend checks**

Run: `npm run lint -w client`

Expected: no errors.

Run: `npm run build:client`

Expected: Next build success.

- [ ] **Step 5: Commit**

Commit message: `feat: refresh auth tokens from frontend`

---

### Task 5: Final Verification And Review

**Files:**
- No new production files unless verification exposes a defect.

- [ ] **Step 1: Run all verification commands**

Run:

```powershell
npm run build:server
npm run lint -w client
npm run build:client
npm audit
git diff --check
```

Expected:

- Backend build succeeds and tests pass.
- Client lint exits 0.
- Client build exits 0.
- `npm audit` reports 0 vulnerabilities.
- `git diff --check` reports no whitespace errors. CRLF warnings are acceptable on this Windows workspace.

- [ ] **Step 2: Inspect status**

Run: `git status --short --branch`

Expected: only intentional uncommitted files, with `.idea/data_source_mapping.xml` still excluded.

- [ ] **Step 3: Commit any final test or doc adjustment**

Commit message: `test: verify auth session hardening`

Only commit if there are intentional final changes.

---

## Self-Review

- Spec coverage: Login, Redis sessions, refresh, logout, interceptor Redis validation, frontend localStorage compatibility, and verification are all mapped to tasks.
- Vague-instruction scan: No task relies on deferred or vague implementation instructions.
- Type consistency: `AuthSession`, `AuthSessionService`, `RefreshTokenRequest`, `LoginResponse`, and `JwtUtil` method names are consistent across tasks.
