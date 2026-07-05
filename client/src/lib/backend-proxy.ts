import type { NextApiResponse } from 'next';

const DEFAULT_BACKEND_API_BASE_URL = 'http://localhost:3001';

export function getBackendApiBaseUrl() {
    return (process.env.BACKEND_API_BASE_URL || DEFAULT_BACKEND_API_BASE_URL).replace(/\/+$/, '');
}

export function buildBackendUrl(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${getBackendApiBaseUrl()}${normalizedPath}`;
}

export async function forwardBackendResponse(
    backendResponse: Response,
    res: NextApiResponse
) {
    const rawBody = await backendResponse.text();

    if (!rawBody) {
        return res.status(backendResponse.status).json({
            success: backendResponse.ok,
            code: backendResponse.ok ? 'SUCCESS' : 'BACKEND_EMPTY_RESPONSE',
            message: backendResponse.ok ? 'success' : '请求失败',
            data: null,
        });
    }

    try {
        const data = JSON.parse(rawBody);
        return res.status(backendResponse.status).json(data);
    } catch {
        const preview = rawBody.replace(/\s+/g, ' ').slice(0, 160);

        return res.status(backendResponse.status || 500).json({
            success: false,
            code: 'BACKEND_INVALID_RESPONSE',
            message: `后端返回了非 JSON 内容: ${preview}`,
            data: null,
        });
    }
}
