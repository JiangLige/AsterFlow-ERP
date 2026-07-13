import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './api';
import { getAccessToken, saveAuth } from './auth';
import {
    installBrowserEnvironment,
    removeBrowserEnvironment,
} from '../test/browser-env';

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

describe('apiRequest authentication', () => {
    beforeEach(() => {
        installBrowserEnvironment('/products');
        saveAuth({
            accessToken: 'access-old',
            refreshToken: 'refresh-1',
            username: 'admin',
            realName: '系统管理员',
            role: 'ADMIN',
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        removeBrowserEnvironment();
    });

    it('returns successful business data without refreshing', async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
            success: true,
            code: 'SUCCESS',
            message: '操作成功',
            data: { id: 1 },
        }));
        vi.stubGlobal('fetch', fetchMock);

        await expect(apiRequest('/api/products/1')).resolves.toEqual({ id: 1 });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('/api/products/1');
    });

    it('refreshes once and retries the original request with the new access token', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(jsonResponse({
                success: false,
                code: 'UNAUTHORIZED',
                message: '登录已过期',
                data: null,
            }, 401))
            .mockResolvedValueOnce(jsonResponse({
                success: true,
                code: 'SUCCESS',
                message: '操作成功',
                data: {
                    accessToken: 'access-new',
                    refreshToken: 'refresh-1',
                },
            }))
            .mockResolvedValueOnce(jsonResponse({
                success: true,
                code: 'SUCCESS',
                message: '操作成功',
                data: { id: 1 },
            }));
        vi.stubGlobal('fetch', fetchMock);

        const result = await apiRequest<{ id: number }>('/api/products/1');

        expect(result).toEqual({ id: 1 });
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/refresh');
        expect(new Headers(fetchMock.mock.calls[2][1]?.headers).get('Authorization'))
            .toBe('Bearer access-new');
        expect(getAccessToken()).toBe('access-new');
    });

    it('shares one refresh request between concurrent unauthorized requests', async () => {
        let refreshCalls = 0;
        const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
            if (url === '/api/auth/refresh') {
                refreshCalls += 1;
                await new Promise((resolve) => setTimeout(resolve, 5));
                return jsonResponse({
                    success: true,
                    code: 'SUCCESS',
                    message: '操作成功',
                    data: {
                        accessToken: 'access-new',
                        refreshToken: 'refresh-1',
                    },
                });
            }

            const authorization = new Headers(init?.headers).get('Authorization');

            if (authorization === 'Bearer access-old') {
                return jsonResponse({
                    success: false,
                    code: 'UNAUTHORIZED',
                    message: '登录已过期',
                    data: null,
                }, 401);
            }

            return jsonResponse({
                success: true,
                code: 'SUCCESS',
                message: '操作成功',
                data: { ok: true },
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        await Promise.all([
            apiRequest('/api/products'),
            apiRequest('/api/customers'),
        ]);

        expect(refreshCalls).toBe(1);
    });

    it('clears authentication and redirects when refresh fails', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(jsonResponse({
                success: false,
                code: 'UNAUTHORIZED',
                message: '登录已过期',
                data: null,
            }, 401))
            .mockResolvedValueOnce(jsonResponse({
                success: false,
                code: 'UNAUTHORIZED',
                message: '刷新令牌无效',
                data: null,
            }, 401));
        vi.stubGlobal('fetch', fetchMock);

        await expect(apiRequest('/api/products')).rejects.toThrow('刷新令牌无效');

        expect(getAccessToken()).toBe('');
        expect(window.location.href).toBe('/login');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not call refresh when no refresh token is stored', async () => {
        window.localStorage.removeItem('refreshToken');
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
            success: false,
            code: 'UNAUTHORIZED',
            message: '登录已过期',
            data: null,
        }, 401));
        vi.stubGlobal('fetch', fetchMock);

        await expect(apiRequest('/api/products')).rejects
            .toThrow('登录状态已过期，请重新登录');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(getAccessToken()).toBe('');
        expect(window.location.href).toBe('/login');
    });

    it('does not refresh again when the retried request is unauthorized', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(jsonResponse({
                success: false,
                code: 'UNAUTHORIZED',
                message: '登录已过期',
                data: null,
            }, 401))
            .mockResolvedValueOnce(jsonResponse({
                success: true,
                code: 'SUCCESS',
                message: '操作成功',
                data: {
                    accessToken: 'access-new',
                    refreshToken: 'refresh-1',
                },
            }))
            .mockResolvedValueOnce(jsonResponse({
                success: false,
                code: 'UNAUTHORIZED',
                message: '会话已撤销',
                data: null,
            }, 401));
        vi.stubGlobal('fetch', fetchMock);

        await expect(apiRequest('/api/products')).rejects.toThrow('会话已撤销');

        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(getAccessToken()).toBe('');
    });
});
