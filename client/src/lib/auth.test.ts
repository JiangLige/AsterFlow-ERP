import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    clearAuthStorage,
    getAccessToken,
    getRefreshToken,
    saveAuth,
    saveAuthTokens,
} from './auth';
import {
    installBrowserEnvironment,
    removeBrowserEnvironment,
} from '../test/browser-env';

describe('auth storage', () => {
    beforeEach(() => {
        installBrowserEnvironment();
    });

    afterEach(() => {
        removeBrowserEnvironment();
    });

    it('stores access token, refresh token, and user identity', () => {
        saveAuth({
            accessToken: 'access-1',
            refreshToken: 'refresh-1',
            username: 'admin',
            realName: '系统管理员',
            role: 'ADMIN',
        });

        expect(getAccessToken()).toBe('access-1');
        expect(getRefreshToken()).toBe('refresh-1');
        expect(window.localStorage.getItem('token')).toBe('access-1');
        expect(window.localStorage.getItem('accessToken')).toBe('access-1');
        expect(window.localStorage.getItem('username')).toBe('admin');
        expect(window.localStorage.getItem('role')).toBe('ADMIN');
    });

    it('updates tokens while preserving the current refresh token when omitted', () => {
        saveAuthTokens('access-1', 'refresh-1');

        saveAuthTokens('access-2');

        expect(getAccessToken()).toBe('access-2');
        expect(getRefreshToken()).toBe('refresh-1');
    });

    it('clears every authentication key', () => {
        saveAuth({
            token: 'access-1',
            refreshToken: 'refresh-1',
            username: 'staff',
            realName: '业务员',
            role: 'STAFF',
        });

        clearAuthStorage();

        expect(getAccessToken()).toBe('');
        expect(getRefreshToken()).toBe('');
        expect(window.localStorage.getItem('username')).toBeNull();
        expect(window.localStorage.getItem('realName')).toBeNull();
        expect(window.localStorage.getItem('role')).toBeNull();
    });
});
