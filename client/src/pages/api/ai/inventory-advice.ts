import type { NextApiRequest, NextApiResponse } from 'next';
import { buildBackendUrl, forwardBackendResponse } from '@/lib/backend-proxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            code: 'METHOD_NOT_ALLOWED',
            message: '只支持 GET 请求',
            data: null,
        });
    }

    const authorization = req.headers.authorization;

    const backendResponse = await fetch(buildBackendUrl('/api/ai/inventory-advice'), {
        method: 'GET',
        headers: {
            Authorization: authorization || '',
        },
    });

    return forwardBackendResponse(backendResponse, res);
}