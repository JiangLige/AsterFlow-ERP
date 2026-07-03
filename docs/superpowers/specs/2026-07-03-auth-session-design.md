# Auth Session Design

Date: 2026-07-03

## Goal

Upgrade AsterFlow ERP authentication from stateless JWT-only access to JWT access tokens backed by Redis session state. The first implementation slice should make server-side logout, refresh, and token revocation possible without replacing the current MVC interceptor stack.

## Current State

- Backend already has `/api/auth/login`, `JwtUtil`, `JwtInterceptor`, BCrypt password verification, and request attributes for `userId`, `username`, and `role`.
- Redis is already available through `spring-boot-starter-data-redis` and `StringRedisTemplate`.
- Frontend stores the access token in `localStorage` and forwards it through Next API routes in the `Authorization` header.
- Logout is currently local-only: the browser deletes `localStorage` values, but the server cannot revoke an existing JWT.

## Recommended Approach

Use the existing JWT interceptor and add a Redis-backed session service.

Login creates two tokens:

- Access token: short-lived JWT used on protected API requests.
- Refresh token: random opaque token stored server-side in Redis and used only to renew the access token.

Redis stores session state:

- `asterflow-erp:auth:refresh:{refreshToken}` -> session id and user id.
- `asterflow-erp:auth:session:{sessionId}` -> user id, username, role, status, and expiration metadata.

The access JWT should include a `sessionId` claim. On every protected request, the interceptor verifies the JWT and then checks that the Redis session still exists and is active.

## API Changes

Add these endpoints:

- `POST /api/auth/refresh`
  - Request: refresh token.
  - Response: new access token and user summary.
  - Fails with `UNAUTHORIZED` if the refresh token is unknown or expired.

- `POST /api/auth/logout`
  - Request: current authorization header and optionally refresh token.
  - Deletes the Redis session and refresh token mapping.
  - Returns success even if the session is already gone.

Update login response:

- Keep `token` temporarily for frontend compatibility.
- Add `accessToken`, `refreshToken`, and `expiresInSeconds`.

## Security Rules

- Refresh tokens must be opaque random values, not JWTs.
- Redis should store only hashed refresh tokens or a non-sensitive lookup id when practical. If a direct token lookup is used in the first slice, it must be isolated behind a service so hashing can be added without controller changes.
- Access tokens should be short-lived. Recommended default: 30 minutes.
- Refresh sessions should be longer-lived. Recommended default: 7 days.
- The interceptor must not trust role claims alone; it must require an active Redis session.
- Errors must remain generic: invalid username/password and invalid/expired token messages should not leak details.
- No secrets or real tokens should be logged.

## Frontend Scope

First slice:

- Store `accessToken` and `refreshToken` in `localStorage` for compatibility with the current app.
- Use `accessToken` for existing API requests.
- Call `/api/auth/logout` before clearing local storage.
- Add refresh support in the API helper only when a request receives `UNAUTHORIZED`.

Later hardening slice:

- Move refresh token to an httpOnly, secure, sameSite cookie through the Next API layer.
- Remove long-lived token material from `localStorage`.

## Testing

Backend tests should cover:

- Login creates access token, refresh token, and Redis session.
- Protected request fails when JWT is valid but Redis session is missing.
- Refresh token returns a new access token while session is active.
- Logout removes session state and makes the old access token fail.
- Inactive users cannot log in or refresh.

Frontend tests are not currently established in the project, so this slice should at least verify `npm run lint -w client` and `npm run build:client` after frontend changes.

## Non-Goals

- Do not replace MVC interceptors with a full Spring Security filter chain in this slice.
- Do not implement user management screens.
- Do not implement password reset or MFA.
- Do not move to httpOnly cookie storage in the first slice.
- Do not add distributed rate limiting yet.

## Implementation Order

1. Add backend tests for session-backed JWT behavior.
2. Add auth session service and DTOs.
3. Extend `JwtUtil` with `sessionId` and configurable expiration seconds.
4. Update login, refresh, logout, and interceptor logic.
5. Add frontend proxy routes and client logout/refresh support.
6. Run server build, client lint/build, and audit.
