import type { NextApiRequest, NextApiResponse } from 'next';
import { buildBackendUrl, forwardBackendResponse } from '@/lib/backend-proxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const idempotencyKey = req.headers['idempotency-key'];
    const authorization = req.headers.authorization;

    const backendResponse = await fetch(buildBackendUrl(`/api/sale-orders/${id}/cancel`), {
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: authorization || '',
            'Idempotency-Key': typeof idempotencyKey === 'string' ? idempotencyKey : '',
        },
    });

    return forwardBackendResponse(backendResponse, res);
}
