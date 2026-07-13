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
