import type { NextApiRequest, NextApiResponse } from 'next';
import { buildBackendUrl, forwardBackendResponse } from '@/lib/backend-proxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authorization = req.headers.authorization;

    let backendUrl = buildBackendUrl('/api/customers');

    if (req.method === 'GET') {
        const query = new URLSearchParams();

        if (typeof req.query.keyword === 'string') {
            query.set('keyword', req.query.keyword);
        }

        if (typeof req.query.status === 'string') {
            query.set('status', req.query.status);
        }

        query.set('page', typeof req.query.page === 'string' ? req.query.page : '1');
        query.set('size', typeof req.query.size === 'string' ? req.query.size : '10');

        backendUrl += `?${query.toString()}`;
    }

    const backendResponse = await fetch(backendUrl, {
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: authorization || '',
        },
        body: req.method === 'GET' ? undefined : JSON.stringify(req.body),
    });

    return forwardBackendResponse(backendResponse, res);
}
