import type { NextApiRequest, NextApiResponse } from 'next';
import { buildBackendUrl, forwardBackendResponse } from '@/lib/backend-proxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authorization = req.headers.authorization;

    const query = new URLSearchParams();

    if (typeof req.query.keyword === 'string') query.set('keyword', req.query.keyword);
    if (typeof req.query.action === 'string') query.set('action', req.query.action);
    if (typeof req.query.targetType === 'string') query.set('targetType', req.query.targetType);

    query.set('page', typeof req.query.page === 'string' ? req.query.page : '1');
    query.set('size', typeof req.query.size === 'string' ? req.query.size : '10');

    const backendResponse = await fetch(
        `${buildBackendUrl('/api/audit-logs')}?${query.toString()}`,
        {
            method: 'GET',
            headers: {
                Authorization: authorization || '',
            },
        }
    );

    return forwardBackendResponse(backendResponse, res);
}