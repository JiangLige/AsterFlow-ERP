import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({
            success: false,
            message: '前端代理没有收到 Authorization',
        });
    }

    const backendResponse = await fetch('http://localhost:3001/api/dashboard/summary', {
        headers: {
            Authorization: authorization,
        },
    });

    const data = await backendResponse.json();

    return res.status(backendResponse.status).json(data);
}