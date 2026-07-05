import type { NextApiRequest, NextApiResponse } from 'next';
import { buildBackendUrl, forwardBackendResponse } from '@/lib/backend-proxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authorization = req.headers.authorization;

    const query = new URLSearchParams();

    if (typeof req.query.keyword === 'string') query.set('keyword', req.query.keyword);
    if (typeof req.query.type === 'string') query.set('type', req.query.type);
    if (typeof req.query.startTime === 'string') query.set('startTime', req.query.startTime);
    if (typeof req.query.endTime === 'string') query.set('endTime', req.query.endTime);

    query.set('page', typeof req.query.page === 'string' ? req.query.page : '1');
    query.set('size', typeof req.query.size === 'string' ? req.query.size : '10');

    const backendResponse = await fetch(
        `${buildBackendUrl('/api/stock-records')}?${query.toString()}`,
        {
            method: 'GET',
            headers: {
                Authorization: authorization || '',
            },
        }
    );

    return forwardBackendResponse(backendResponse, res);
}