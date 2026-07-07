import { clearAuthStorage, getAccessToken } from './auth';

export async function apiRequest<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAccessToken();

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
    let result: any = null;

    if (rawBody) {
        try {
            result = JSON.parse(rawBody);
        } catch {
            const preview = rawBody.replace(/\s+/g, ' ').slice(0, 160);
            throw new Error(
                preview ? `接口返回了非 JSON 内容: ${preview}` : '接口返回了非 JSON 内容'
            );
        }
    }

    if (!response.ok || !result?.success) {
        const message = result?.message || '请求失败';

        if (result?.code === 'UNAUTHORIZED') {
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
