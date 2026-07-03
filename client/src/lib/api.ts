export async function apiRequest<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    return performApiRequest<T>(url, options, true);
}

async function performApiRequest<T>(
    url: string,
    options: RequestInit,
    allowRefresh: boolean
): Promise<T> {
    const token = typeof window !== 'undefined'
        ? getStoredAccessToken()
        : null;

    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const rawBody = await response.text();
    const result = parseApiBody(rawBody);

    if (!response.ok || !result?.success) {
        const message = result?.message || '请求失败';

        if (result?.code === 'UNAUTHORIZED') {
            if (allowRefresh) {
                const refreshedToken = await refreshAccessToken();

                if (refreshedToken) {
                    const retryHeaders = new Headers(options.headers || {});
                    retryHeaders.set('Authorization', `Bearer ${refreshedToken}`);

                    return performApiRequest<T>(
                        url,
                        {
                            ...options,
                            headers: retryHeaders,
                        },
                        false
                    );
                }
            }

            if (typeof window !== 'undefined') {
                clearAuthStorage();

                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }

        throw new Error(message);
    }

    return result.data as T;
}

function parseApiBody(rawBody: string) {
    if (!rawBody) {
        return null;
    }

    try {
        return JSON.parse(rawBody);
    } catch {
        const preview = rawBody.replace(/\s+/g, ' ').slice(0, 160);
        throw new Error(
            preview ? `接口返回了非 JSON 内容: ${preview}` : '接口返回了非 JSON 内容'
        );
    }
}

function getStoredAccessToken() {
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
}

async function refreshAccessToken() {
    if (typeof window === 'undefined') {
        return null;
    }

    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
        return null;
    }

    try {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refreshToken,
            }),
        });

        const result = parseApiBody(await response.text());

        if (!response.ok || !result?.success || !result.data?.accessToken) {
            return null;
        }

        const accessToken = result.data.accessToken as string;
        const nextRefreshToken = result.data.refreshToken || refreshToken;

        localStorage.setItem('token', accessToken);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', nextRefreshToken);

        return accessToken;
    } catch {
        return null;
    }
}

function clearAuthStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('realName');
    localStorage.removeItem('role');
}
