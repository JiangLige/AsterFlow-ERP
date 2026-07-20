import type { NextApiRequest, NextApiResponse } from 'next';
import { buildBackendUrl, forwardBackendResponse } from '@/lib/backend-proxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authorization = req.headers.authorization;

    const backendResponse = await fetch(buildBackendUrl('/api/products/warnings'), {
        headers: {
            Authorization: authorization || '',
        },
    });
    return forwardBackendResponse(backendResponse, res);
}
