import type { NextApiRequest, NextApiResponse } from 'next';
import { buildBackendUrl, forwardBackendResponse } from '@/lib/backend-proxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authorization = req.headers.authorization;
    const { id } = req.query;

    const backendResponse = await fetch(buildBackendUrl(`/api/suppliers/${id}/inactive`), {
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: authorization || '',
        },
    });

    return forwardBackendResponse(backendResponse, res);
}