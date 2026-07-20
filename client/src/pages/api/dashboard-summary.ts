import type { NextApiRequest, NextApiResponse } from 'next';
import { buildBackendUrl, forwardBackendResponse } from '@/lib/backend-proxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({
            success: false,
            code: 'UNAUTHORIZED',
            message: '前端代理没有收到 Authorization',
            data: null,
        });
    }

    const backendResponse = await fetch(buildBackendUrl('/api/dashboard/summary'), {
        headers: {
            Authorization: authorization,
        },
    });
    return forwardBackendResponse(backendResponse, res);
}
