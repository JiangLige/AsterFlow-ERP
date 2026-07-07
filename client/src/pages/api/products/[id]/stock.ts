import type { NextApiRequest, NextApiResponse } from 'next';
import { buildBackendUrl, forwardBackendResponse } from '@/lib/backend-proxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const authorization = req.headers.authorization;
    const idempotencyKey = req.headers['idempotency-key'];

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: authorization || '',
    };

    if (typeof idempotencyKey === 'string') {
        headers['Idempotency-Key'] = idempotencyKey;
    }

    const backendResponse = await fetch(buildBackendUrl(`/api/products/${id}/stock`), {
        method: req.method,
        headers,
        body: JSON.stringify(req.body),
    });

    return forwardBackendResponse(backendResponse, res);
}