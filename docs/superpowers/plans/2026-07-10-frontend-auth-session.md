# AsterFlow ERP Frontend Auth Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the frontend authentication session lifecycle with refresh-token persistence, one-time automatic refresh, shared concurrent refresh, backend logout, and unified `123456` demo credentials.

**Architecture:** Keep browser storage isolated in `client/src/lib/auth.ts` and network/session coordination in `client/src/lib/api.ts`. All business pages continue to use `apiRequest`; a module-level Promise ensures concurrent 401 responses share one refresh request. The backend contract remains unchanged, while seed data, tests, frontend defaults, and docs are synchronized to the approved demo credentials.

**Tech Stack:** Next.js 14, React 18, TypeScript 5.4, Vitest, Node.js 20, Spring Boot 4.0.5, Java 21, JUnit 5, BCrypt.

## Global Constraints

- Demo credentials are exactly `admin / 123456` and `staff / 123456`.
- Vitest is a development dependency only; add no frontend production dependency.
- Keep the existing localStorage authentication architecture; do not migrate to cookies.
- Refresh a failed request at most once and retry the original request at most once.
- Concurrent unauthorized requests must share one refresh Promise.
- Logout must send both the access token and refresh token to the existing backend endpoint.
- Local authentication data must be cleared even if backend logout fails.
- Preserve Chinese user-facing messages and UTF-8 source files.
- Do not change JWT expiration, role permissions, Redis session behavior, or backend endpoint contracts.
- Do not commit real secrets or production credentials.

---

## File Structure

**Create:**

- `client/vitest.config.ts`: Vitest Node-environment configuration.
- `client/src/test/browser-env.ts`: deterministic localStorage and location test double.
- `client/src/lib/auth.test.ts`: storage lifecycle tests.
- `client/src/lib/api.test.ts`: refresh, retry, concurrency, failure, and logout tests.

**Modify:**

- `client/src/lib/auth.ts`: token getters, token persistence, and complete clearing.
- `client/src/lib/api.ts`: response parsing, single-flight refresh, one-time retry, session expiry, and logout.
- `client/src/components/Layout.tsx`: asynchronous backend logout and duplicate-click protection.
- `client/src/pages/login.tsx`: approved password and complete login response persistence.
- `client/package.json`, `package.json`, `package-lock.json`: Vitest and test scripts.
- `server/src/test/java/com/asterflow/erp/auth/AuthSessionIntegrationTest.java`: both default users and shared password.
- `server/src/test/java/com/asterflow/erp/controller/ApiSecurityIntegrationTest.java`: approved test credentials.
- `server/src/test/resources/data.sql`: admin and staff test users.
- `server/src/main/resources/db/init.sql`: admin and staff demo users.
- `.github/workflows/ci.yml`: frontend tests before build.
- `README.md`, `docs/PROJECT_ROADMAP.md`, `docs/TESTING_GUIDE.md`: credentials and test behavior.

---

### Task 1: Add Frontend Test Harness And Complete Auth Storage

**Files:**

- Create: `client/vitest.config.ts`
- Create: `client/src/test/browser-env.ts`
- Create: `client/src/lib/auth.test.ts`
- Modify: `client/src/lib/auth.ts`
- Modify: `client/package.json`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**

- Consumes: browser `localStorage`.
- Produces: `getAccessToken(): string`, `getRefreshToken(): string`, `saveAuthTokens(accessToken: string, refreshToken?: string): void`, `saveAuth(data: AuthData): void`, `clearAuthStorage(): void`.

- [ ] **Step 1: Install Vitest and add test scripts**

Run from repository root:

```powershell
npm install --workspace client --save-dev vitest
```

Add this script to `client/package.json`:

```json
"test": "vitest run"
```

Add this script to root `package.json`:

```json
"test:client": "npm --workspace client test"
```

Expected: `client/package.json` and `package-lock.json` contain Vitest as a development dependency; no runtime dependency is added.

- [ ] **Step 2: Create the Vitest configuration and browser test double**

Create `client/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        clearMocks: true,
        restoreMocks: true,
    },
});
```

Create `client/src/test/browser-env.ts`:

```ts
export class MemoryStorage implements Storage {
    private readonly values = new Map<string, string>();

    get length() {
        return this.values.size;
    }

    clear() {
        this.values.clear();
    }

    getItem(key: string) {
        return this.values.get(key) ?? null;
    }

    key(index: number) {
        return Array.from(this.values.keys())[index] ?? null;
    }

    removeItem(key: string) {
        this.values.delete(key);
    }

    setItem(key: string, value: string) {
        this.values.set(key, value);
    }
}

export function installBrowserEnvironment(pathname = '/') {
    const localStorage = new MemoryStorage();
    const location = { pathname, href: pathname };

    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: { localStorage, location },
    });
    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: localStorage,
    });

    return { localStorage, location };
}

export function removeBrowserEnvironment() {
    Reflect.deleteProperty(globalThis, 'window');
    Reflect.deleteProperty(globalThis, 'localStorage');
}
```

- [ ] **Step 3: Write failing auth storage tests**

Create `client/src/lib/auth.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    clearAuthStorage,
    getAccessToken,
    getRefreshToken,
    saveAuth,
    saveAuthTokens,
} from './auth';
import {
    installBrowserEnvironment,
    removeBrowserEnvironment,
} from '../test/browser-env';

describe('auth storage', () => {
    beforeEach(() => {
        installBrowserEnvironment();
    });

    afterEach(() => {
        removeBrowserEnvironment();
    });

    it('stores access token, refresh token, and user identity', () => {
        saveAuth({
            accessToken: 'access-1',
            refreshToken: 'refresh-1',
            username: 'admin',
            realName: '系统管理员',
            role: 'ADMIN',
        });

        expect(getAccessToken()).toBe('access-1');
        expect(getRefreshToken()).toBe('refresh-1');
        expect(window.localStorage.getItem('token')).toBe('access-1');
        expect(window.localStorage.getItem('accessToken')).toBe('access-1');
        expect(window.localStorage.getItem('username')).toBe('admin');
        expect(window.localStorage.getItem('role')).toBe('ADMIN');
    });

    it('updates tokens while preserving the current refresh token when omitted', () => {
        saveAuthTokens('access-1', 'refresh-1');

        saveAuthTokens('access-2');

        expect(getAccessToken()).toBe('access-2');
        expect(getRefreshToken()).toBe('refresh-1');
    });

    it('clears every authentication key', () => {
        saveAuth({
            token: 'access-1',
            refreshToken: 'refresh-1',
            username: 'staff',
            realName: '业务员',
            role: 'STAFF',
        });

        clearAuthStorage();

        expect(getAccessToken()).toBe('');
        expect(getRefreshToken()).toBe('');
        expect(window.localStorage.getItem('username')).toBeNull();
        expect(window.localStorage.getItem('realName')).toBeNull();
        expect(window.localStorage.getItem('role')).toBeNull();
    });
});
```

- [ ] **Step 4: Run the auth test and verify RED**

```powershell
npm --workspace client test -- src/lib/auth.test.ts
```

Expected: FAIL because `getRefreshToken`, `saveAuthTokens`, and the expanded `saveAuth` input do not exist yet.

- [ ] **Step 5: Implement the auth storage contract**

Replace `client/src/lib/auth.ts` with:

```ts
export type StoredUser = {
    username: string;
    realName: string;
    role: string;
};

export type AuthData = StoredUser & {
    token?: string;
    accessToken?: string;
    refreshToken: string;
};

export function getAccessToken() {
    if (typeof window === 'undefined') {
        return '';
    }

    return localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
}

export function getRefreshToken() {
    if (typeof window === 'undefined') {
        return '';
    }

    return localStorage.getItem('refreshToken') || '';
}

export function hasAccessToken() {
    return Boolean(getAccessToken());
}

export function getStoredUser(): StoredUser {
    if (typeof window === 'undefined') {
        return { username: '', realName: '', role: '' };
    }

    return {
        username: localStorage.getItem('username') || '',
        realName: localStorage.getItem('realName') || '',
        role: localStorage.getItem('role') || '',
    };
}

export function saveAuthTokens(accessToken: string, refreshToken = getRefreshToken()) {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('accessToken', accessToken);

    if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
    } else {
        localStorage.removeItem('refreshToken');
    }
}

export function saveAuth(data: AuthData) {
    const accessToken = data.accessToken || data.token || '';

    saveAuthTokens(accessToken, data.refreshToken);
    localStorage.setItem('username', data.username || '');
    localStorage.setItem('realName', data.realName || '');
    localStorage.setItem('role', data.role || '');
}

export function clearAuthStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('realName');
    localStorage.removeItem('role');
}
```

- [ ] **Step 6: Run the auth tests and frontend type/build check**

```powershell
npm --workspace client test -- src/lib/auth.test.ts
npm run build:client
```

Expected: auth tests PASS; Next.js build PASS.

- [ ] **Step 7: Commit the storage slice**

```powershell
git add client/vitest.config.ts client/src/test/browser-env.ts client/src/lib/auth.test.ts client/src/lib/auth.ts client/package.json package.json package-lock.json
git commit -m "feat: persist frontend refresh tokens"
```

---

### Task 2: Add Single-Flight Refresh And One-Time Request Retry

**Files:**

- Create: `client/src/lib/api.test.ts`
- Modify: `client/src/lib/api.ts`

**Interfaces:**

- Consumes: `getAccessToken`, `getRefreshToken`, `saveAuthTokens`, `clearAuthStorage` from Task 1.
- Produces: `apiRequest<T>(url: string, options?: RequestInit): Promise<T>` with one refresh and one retry.

- [ ] **Step 1: Write failing refresh and concurrency tests**

Create `client/src/lib/api.test.ts` with the refresh tests below. Task 3 will extend this same file with logout tests.

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './api';
import { getAccessToken, saveAuth } from './auth';
import {
    installBrowserEnvironment,
    removeBrowserEnvironment,
} from '../test/browser-env';

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

describe('apiRequest authentication', () => {
    beforeEach(() => {
        installBrowserEnvironment('/products');
        saveAuth({
            accessToken: 'access-old',
            refreshToken: 'refresh-1',
            username: 'admin',
            realName: '系统管理员',
            role: 'ADMIN',
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        removeBrowserEnvironment();
    });

    it('returns successful business data without refreshing', async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
            success: true,
            code: 'SUCCESS',
            message: '操作成功',
            data: { id: 1 },
        }));
        vi.stubGlobal('fetch', fetchMock);

        await expect(apiRequest('/api/products/1')).resolves.toEqual({ id: 1 });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('/api/products/1');
    });

    it('refreshes once and retries the original request with the new access token', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(jsonResponse({
                success: false,
                code: 'UNAUTHORIZED',
                message: '登录已过期',
                data: null,
            }, 401))
            .mockResolvedValueOnce(jsonResponse({
                success: true,
                code: 'SUCCESS',
                message: '操作成功',
                data: {
                    accessToken: 'access-new',
                    refreshToken: 'refresh-1',
                },
            }))
            .mockResolvedValueOnce(jsonResponse({
                success: true,
                code: 'SUCCESS',
                message: '操作成功',
                data: { id: 1 },
            }));
        vi.stubGlobal('fetch', fetchMock);

        const result = await apiRequest<{ id: number }>('/api/products/1');

        expect(result).toEqual({ id: 1 });
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/refresh');
        expect(new Headers(fetchMock.mock.calls[2][1]?.headers).get('Authorization'))
            .toBe('Bearer access-new');
        expect(getAccessToken()).toBe('access-new');
    });

    it('shares one refresh request between concurrent unauthorized requests', async () => {
        let refreshCalls = 0;
        const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
            if (url === '/api/auth/refresh') {
                refreshCalls += 1;
                await new Promise((resolve) => setTimeout(resolve, 5));
                return jsonResponse({
                    success: true,
                    code: 'SUCCESS',
                    message: '操作成功',
                    data: {
                        accessToken: 'access-new',
                        refreshToken: 'refresh-1',
                    },
                });
            }

            const authorization = new Headers(init?.headers).get('Authorization');

            if (authorization === 'Bearer access-old') {
                return jsonResponse({
                    success: false,
                    code: 'UNAUTHORIZED',
                    message: '登录已过期',
                    data: null,
                }, 401);
            }

            return jsonResponse({
                success: true,
                code: 'SUCCESS',
                message: '操作成功',
                data: { ok: true },
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        await Promise.all([
            apiRequest('/api/products'),
            apiRequest('/api/customers'),
        ]);

        expect(refreshCalls).toBe(1);
    });

    it('clears authentication and redirects when refresh fails', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(jsonResponse({
                success: false,
                code: 'UNAUTHORIZED',
                message: '登录已过期',
                data: null,
            }, 401))
            .mockResolvedValueOnce(jsonResponse({
                success: false,
                code: 'UNAUTHORIZED',
                message: '刷新令牌无效',
                data: null,
            }, 401));
        vi.stubGlobal('fetch', fetchMock);

        await expect(apiRequest('/api/products')).rejects.toThrow('刷新令牌无效');

        expect(getAccessToken()).toBe('');
        expect(window.location.href).toBe('/login');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not call refresh when no refresh token is stored', async () => {
        window.localStorage.removeItem('refreshToken');
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
            success: false,
            code: 'UNAUTHORIZED',
            message: '登录已过期',
            data: null,
        }, 401));
        vi.stubGlobal('fetch', fetchMock);

        await expect(apiRequest('/api/products')).rejects
            .toThrow('登录状态已过期，请重新登录');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(getAccessToken()).toBe('');
        expect(window.location.href).toBe('/login');
    });

    it('does not refresh again when the retried request is unauthorized', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(jsonResponse({
                success: false,
                code: 'UNAUTHORIZED',
                message: '登录已过期',
                data: null,
            }, 401))
            .mockResolvedValueOnce(jsonResponse({
                success: true,
                code: 'SUCCESS',
                message: '操作成功',
                data: {
                    accessToken: 'access-new',
                    refreshToken: 'refresh-1',
                },
            }))
            .mockResolvedValueOnce(jsonResponse({
                success: false,
                code: 'UNAUTHORIZED',
                message: '会话已撤销',
                data: null,
            }, 401));
        vi.stubGlobal('fetch', fetchMock);

        await expect(apiRequest('/api/products')).rejects.toThrow('会话已撤销');

        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(getAccessToken()).toBe('');
    });
});
```

- [ ] **Step 2: Run the API tests and verify RED**

```powershell
npm --workspace client test -- src/lib/api.test.ts
```

Expected: FAIL because the existing `apiRequest` clears auth immediately and never calls `/api/auth/refresh`.

- [ ] **Step 3: Implement response parsing, shared refresh, and one-time retry**

Replace `client/src/lib/api.ts` with:

```ts
import {
    clearAuthStorage,
    getAccessToken,
    getRefreshToken,
    saveAuthTokens,
} from './auth';

type ApiEnvelope<T> = {
    success: boolean;
    code?: string;
    message?: string;
    data: T;
};

type RefreshData = {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
};

let refreshPromise: Promise<string> | null = null;

async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T> | null> {
    const rawBody = await response.text();

    if (!rawBody) {
        return null;
    }

    try {
        return JSON.parse(rawBody) as ApiEnvelope<T>;
    } catch {
        const preview = rawBody.replace(/\s+/g, ' ').slice(0, 160);
        throw new Error(
            preview ? `接口返回了非 JSON 内容: ${preview}` : '接口返回了非 JSON 内容'
        );
    }
}

function expireSession() {
    clearAuthStorage();

    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
}

async function performRefresh() {
    const currentRefreshToken = getRefreshToken();

    if (!currentRefreshToken) {
        throw new Error('登录状态已过期，请重新登录');
    }

    const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });
    const result = await readEnvelope<RefreshData>(response);

    if (!response.ok || !result?.success) {
        throw new Error(result?.message || '登录状态已过期，请重新登录');
    }

    const accessToken = result.data?.accessToken || result.data?.token || '';

    if (!accessToken) {
        throw new Error('刷新响应缺少访问令牌');
    }

    saveAuthTokens(accessToken, result.data.refreshToken || currentRefreshToken);
    return accessToken;
}

function refreshAccessToken() {
    if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

async function requestWithAuth<T>(
    url: string,
    options: RequestInit,
    allowRefresh: boolean,
    accessToken = getAccessToken()
): Promise<T> {
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (accessToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const response = await fetch(url, { ...options, headers });
    const result = await readEnvelope<T>(response);

    if (result?.code === 'UNAUTHORIZED' && allowRefresh) {
        try {
            const refreshedAccessToken = await refreshAccessToken();
            return requestWithAuth<T>(url, options, false, refreshedAccessToken);
        } catch (error) {
            expireSession();
            throw error instanceof Error
                ? error
                : new Error('登录状态已过期，请重新登录');
        }
    }

    if (!response.ok || !result?.success) {
        if (result?.code === 'UNAUTHORIZED') {
            expireSession();
        }

        throw new Error(result?.message || '请求失败');
    }

    return result.data;
}

export function apiRequest<T>(url: string, options: RequestInit = {}) {
    return requestWithAuth<T>(url, options, true);
}
```

- [ ] **Step 4: Run API and auth tests**

```powershell
npm --workspace client test -- src/lib/auth.test.ts src/lib/api.test.ts
```

Expected: all frontend auth tests PASS.

- [ ] **Step 5: Run frontend production build**

```powershell
npm run build:client
```

Expected: Next.js lint, type checking, compilation, and static page generation PASS.

- [ ] **Step 6: Commit the refresh slice**

```powershell
git add client/src/lib/api.ts client/src/lib/api.test.ts
git commit -m "feat: refresh expired frontend sessions"
```

---

### Task 3: Call Backend Logout And Protect The Logout Button

**Files:**

- Modify: `client/src/lib/api.test.ts`
- Modify: `client/src/lib/api.ts`
- Modify: `client/src/components/Layout.tsx`

**Interfaces:**

- Consumes: `getAccessToken`, `getRefreshToken`, `clearAuthStorage`.
- Produces: `logoutSession(): Promise<void>`.

- [ ] **Step 1: Add failing logout tests**

Extend the import in `client/src/lib/api.test.ts`:

```ts
import { apiRequest, logoutSession } from './api';
import { getAccessToken, getRefreshToken, saveAuth } from './auth';
```

Add these tests inside the existing `describe` block:

```ts
it('sends both tokens to backend logout and clears local auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
        success: true,
        code: 'SUCCESS',
        message: '操作成功',
        data: null,
    }));
    vi.stubGlobal('fetch', fetchMock);

    await logoutSession();

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refreshToken: 'refresh-1' }),
    }));
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(request.headers).get('Authorization')).toBe('Bearer access-old');
    expect(getAccessToken()).toBe('');
    expect(getRefreshToken()).toBe('');
});

it('clears local auth when backend logout fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    await expect(logoutSession()).rejects.toThrow('network down');

    expect(getAccessToken()).toBe('');
    expect(getRefreshToken()).toBe('');
});
```

- [ ] **Step 2: Run the logout tests and verify RED**

```powershell
npm --workspace client test -- src/lib/api.test.ts
```

Expected: FAIL because `logoutSession` is not exported.

- [ ] **Step 3: Implement backend logout with unconditional local cleanup**

Append to `client/src/lib/api.ts`:

```ts
export async function logoutSession() {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    try {
        const headers = new Headers({ 'Content-Type': 'application/json' });

        if (accessToken) {
            headers.set('Authorization', `Bearer ${accessToken}`);
        }

        await fetch('/api/auth/logout', {
            method: 'POST',
            headers,
            body: JSON.stringify({ refreshToken }),
        });
    } finally {
        clearAuthStorage();
    }
}
```

- [ ] **Step 4: Update Layout to await logout and prevent duplicate clicks**

Change the imports in `client/src/components/Layout.tsx`:

```ts
import { getStoredUser, hasAccessToken } from '@/lib/auth';
import { logoutSession } from '@/lib/api';
```

Add state beside the existing state declarations:

```ts
const [loggingOut, setLoggingOut] = useState(false);
```

Replace `handleLogout` with:

```ts
async function handleLogout() {
    if (loggingOut) {
        return;
    }

    setLoggingOut(true);

    try {
        await logoutSession();
    } catch {
        // logoutSession always clears local authentication in finally.
    } finally {
        router.replace('/login');
    }
}
```

Replace the logout button with:

```tsx
<button
    className="logout-button"
    onClick={handleLogout}
    disabled={loggingOut}
>
    {loggingOut ? '退出中...' : '退出'}
</button>
```

- [ ] **Step 5: Run tests and build**

```powershell
npm --workspace client test -- src/lib/api.test.ts
npm run build:client
```

Expected: logout tests PASS; frontend build PASS.

- [ ] **Step 6: Commit the logout slice**

```powershell
git add client/src/lib/api.ts client/src/lib/api.test.ts client/src/components/Layout.tsx
git commit -m "feat: revoke sessions on frontend logout"
```

---

### Task 4: Synchronize Login Response And Shared Demo Password

**Files:**

- Modify: `client/src/pages/login.tsx`
- Modify: `server/src/test/java/com/asterflow/erp/auth/AuthSessionIntegrationTest.java`
- Modify: `server/src/test/java/com/asterflow/erp/controller/ApiSecurityIntegrationTest.java`
- Modify: `server/src/test/resources/data.sql`
- Modify: `server/src/main/resources/db/init.sql`
- Modify: `README.md`
- Modify: `docs/PROJECT_ROADMAP.md`

**Interfaces:**

- Consumes: Task 1 `saveAuth(AuthData)`.
- Produces: both default users authenticate with `123456`; login page saves both token types.

- [ ] **Step 1: Write the failing default-user integration test**

In `AuthSessionIntegrationTest`, replace the no-argument login helper with these helpers:

```java
private LoginResponse login() {
    return login("admin", "123456");
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
```

Add this test:

```java
@Test
void defaultDemoUsersUseSharedPassword() {
    assertThat(login("admin", "123456").getRole()).isEqualTo("ADMIN");
    assertThat(login("staff", "123456").getRole()).isEqualTo("STAFF");
}
```

- [ ] **Step 2: Run the default-user test and verify RED**

```powershell
cd server
.\mvnw.cmd "-Dtest=AuthSessionIntegrationTest#defaultDemoUsersUseSharedPassword" test
```

Expected: FAIL because the current admin password is `admin123` and the H2 seed has no default staff user.

- [ ] **Step 3: Update H2 and MySQL seed credentials**

Use this BCrypt hash for the approved demo password `123456`:

```text
$2a$10$NLIEtAre8GGItWiwZ8Z9jOQDmg.vb6A3WnXJlLA11XWXBtshQYV9.
```

Replace `server/src/test/resources/data.sql` with:

```sql
INSERT INTO t_user
    (username, password, real_name, role, status, created_at, updated_at, deleted, version)
VALUES
    ('admin', '$2a$10$NLIEtAre8GGItWiwZ8Z9jOQDmg.vb6A3WnXJlLA11XWXBtshQYV9.', '系统管理员', 'ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
    ('staff', '$2a$10$NLIEtAre8GGItWiwZ8Z9jOQDmg.vb6A3WnXJlLA11XWXBtshQYV9.', '业务员', 'STAFF', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0);
```

In `server/src/main/resources/db/init.sql`, replace both user password hashes with the same hash and update the header comments to:

```sql
--   admin / 123456
--   staff / 123456
```

- [ ] **Step 4: Update backend security test credentials**

In `ApiSecurityIntegrationTest`:

- Change the admin login password to `123456`.
- Encode `123456` when creating the staff test user.
- Change the staff login password to `123456`.

The resulting credential calls must be:

```java
return login("admin", "123456");
```

```java
user.setPassword(passwordEncoder.encode("123456"));
```

```java
return login("staff", "123456");
```

- [ ] **Step 5: Update the login page to persist both tokens**

In `client/src/pages/login.tsx`, set:

```ts
const [password, setPassword] = useState('123456');
```

Replace the `saveAuth` call with:

```ts
saveAuth({
    token: result.data.token,
    accessToken: result.data.accessToken,
    refreshToken: result.data.refreshToken,
    username: result.data.username,
    realName: result.data.realName,
    role: result.data.role,
});
```

- [ ] **Step 6: Update credential documentation**

In `README.md` and `docs/PROJECT_ROADMAP.md`, make both default account entries exactly:

```text
- 管理员：`admin / 123456`
- 普通员工：`staff / 123456`
```

- [ ] **Step 7: Run backend auth/security tests and frontend tests**

```powershell
cd server
.\mvnw.cmd "-Dtest=AuthSessionIntegrationTest,ApiSecurityIntegrationTest" test
cd ..
npm run test:client
npm run build:client
```

Expected: backend auth/security tests PASS; frontend tests PASS; frontend build PASS.

- [ ] **Step 8: Commit the credential slice**

```powershell
git add client/src/pages/login.tsx server/src/test/java/com/asterflow/erp/auth/AuthSessionIntegrationTest.java server/src/test/java/com/asterflow/erp/controller/ApiSecurityIntegrationTest.java server/src/test/resources/data.sql server/src/main/resources/db/init.sql README.md docs/PROJECT_ROADMAP.md
git commit -m "feat: unify demo account credentials"
```

---

### Task 5: Add CI Coverage, Update Testing Docs, And Run Final Verification

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `docs/TESTING_GUIDE.md`
- Modify: `docs/INTERVIEW_UPGRADE_PLAN.md`

**Interfaces:**

- Consumes: root `npm run test:client`, frontend build, backend Maven Wrapper.
- Produces: CI and documentation that accurately describe the completed authentication flow.

- [ ] **Step 1: Run the new frontend tests before changing CI**

```powershell
npm run test:client
```

Expected: PASS locally, while current CI still lacks this gate.

- [ ] **Step 2: Add the frontend test gate to CI**

In `.github/workflows/ci.yml`, insert this step after `npm ci` and before the frontend build:

```yaml
      - name: Test frontend
        run: npm run test:client
```

- [ ] **Step 3: Document the completed authentication tests and boundaries**

Add a frontend authentication section to `docs/TESTING_GUIDE.md` containing these facts:

```markdown
### 前端认证会话测试

`client/src/lib/auth.test.ts`

- access token、refresh token 和用户信息会一起保存。
- 清理认证状态会删除全部令牌和用户信息。

`client/src/lib/api.test.ts`

- access token 失效后只刷新一次并重试原请求一次。
- 并发未授权请求共享一个刷新请求。
- 刷新失败会清理状态并跳转登录页。
- 退出登录会把 access token 和 refresh token 发送到后端，并始终清理本地状态。
```

Update `docs/INTERVIEW_UPGRADE_PLAN.md` so the authentication capability says the frontend now persists refresh tokens, retries once after refresh, and revokes the backend session on logout. Keep localStorage/XSS risk listed as a production boundary.

- [ ] **Step 4: Run complete frontend verification**

```powershell
npm run test:client
npm run build:client
```

Expected: all Vitest tests PASS; Next.js production build PASS.

- [ ] **Step 5: Run complete backend verification**

```powershell
cd server
.\mvnw.cmd -B clean verify
```

Expected: all backend tests PASS and the backend JAR is built.

- [ ] **Step 6: Check scope, encoding, secrets, and generated artifacts**

Run from repository root:

```powershell
git diff --check
git status --short --branch
git diff -- .github/workflows/ci.yml client server README.md docs/PROJECT_ROADMAP.md docs/TESTING_GUIDE.md docs/INTERVIEW_UPGRADE_PLAN.md
```

Expected:

- No whitespace errors.
- No `.next`, `target`, `.env`, or real secret is staged.
- Only authentication, tests, seed credentials, CI, and related docs changed.

- [ ] **Step 7: Commit CI and documentation**

```powershell
git add .github/workflows/ci.yml docs/TESTING_GUIDE.md docs/INTERVIEW_UPGRADE_PLAN.md
git commit -m "docs: verify frontend auth lifecycle"
```

- [ ] **Step 8: Confirm final repository state**

```powershell
git status --short --branch
git log -8 --oneline --decorate
```

Expected: clean working tree; the branch contains the auth storage, refresh, logout, credential, and CI/docs commits.

---

## Plan Verification Checklist

- [ ] Every design requirement maps to a task and an automated or build verification.
- [ ] Every production behavior begins with a failing test.
- [ ] Refresh and retry are bounded to one attempt.
- [ ] Concurrent refresh is explicitly tested.
- [ ] Logout always clears local state and sends the backend contract fields.
- [ ] Both demo users are verified against the BCrypt seed using `123456`.
- [ ] Frontend tests run locally and in CI.
- [ ] Full frontend build and backend `clean verify` remain final gates.
- [ ] No production dependency, schema structure change, or authentication protocol change is introduced.
