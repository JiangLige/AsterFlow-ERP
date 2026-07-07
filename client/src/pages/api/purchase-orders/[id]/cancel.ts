import type { NextApiRequest, NextApiResponse } from 'next';
import { buildBackendUrl, forwardBackendResponse } from '@/lib/backend-proxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authorization = req.headers.authorization;

    const idempotencyKey = req.headers['idempotency-key'];

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: authorization || '',
    };

    if (typeof idempotencyKey === 'string') {
        headers['Idempotency-Key'] = idempotencyKey;
    }

    const { id } = req.query;

    const backendResponse = await fetch(buildBackendUrl(`/api/purchase-orders/${id}/cancel`), {
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: authorization || '',
        },
    });

    return forwardBackendResponse(backendResponse, res);
}