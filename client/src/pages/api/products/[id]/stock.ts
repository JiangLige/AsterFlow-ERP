import type { NextApiRequest, NextApiResponse } from 'next';
import { buildBackendUrl, forwardBackendResponse } from '@/lib/backend-proxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const authorization = req.headers.authorization;
    const idempotencyKey = req.headers['idempotency-key'];
    const backendResponse = await fetch(buildBackendUrl(`/api/products/${id}/stock`), {
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: authorization || '',
            'Idempotency-Key': typeof idempotencyKey === 'string' ? idempotencyKey : '',
        },
        body: JSON.stringify(req.body),
    });

    return forwardBackendResponse(backendResponse, res);
}