import type { NextApiRequest, NextApiResponse } from 'next';
import { buildBackendUrl, forwardBackendResponse } from '@/lib/backend-proxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            code: 'METHOD_NOT_ALLOWED',
            message: 'Method not allowed',
            data: null,
        });
    }

    const backendResponse = await fetch(buildBackendUrl('/api/auth/logout'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: req.headers.authorization || '',
        },
        body: JSON.stringify(req.body || {}),
    });

    return forwardBackendResponse(backendResponse, res);
}
