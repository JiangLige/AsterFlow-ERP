export type StoredUser = {
    username: string;
    realName: string;
    role: string;
};

export type AuthData = StoredUser & {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
};

export function getAccessToken() {
    if (typeof window === 'undefined') {
        return '';
    }

    return localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
}

export function getRefreshToken() {
    if (typeof window === 'undefined') {
        return '';
    }

    return localStorage.getItem('refreshToken') || '';
}

export function hasAccessToken() {
    return Boolean(getAccessToken());
}

export function getStoredUser(): StoredUser {
    if (typeof window === 'undefined') {
        return { username: '', realName: '', role: '' };
    }

    return {
        username: localStorage.getItem('username') || '',
        realName: localStorage.getItem('realName') || '',
        role: localStorage.getItem('role') || '',
    };
}

export function saveAuthTokens(accessToken: string, refreshToken = getRefreshToken()) {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('accessToken', accessToken);

    if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
    } else {
        localStorage.removeItem('refreshToken');
    }
}

export function saveAuth(data: AuthData) {
    const accessToken = data.accessToken || data.token || '';

    saveAuthTokens(accessToken, data.refreshToken);
    localStorage.setItem('username', data.username || '');
    localStorage.setItem('realName', data.realName || '');
    localStorage.setItem('role', data.role || '');
}

export function clearAuthStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('realName');
    localStorage.removeItem('role');
}
