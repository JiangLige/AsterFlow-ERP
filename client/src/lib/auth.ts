export type StoredUser = {
    username: string;
    realName: string;
    role: string;
};

export function getAccessToken() {
    if (typeof window === 'undefined') {
        return '';
    }

    return localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
}

export function hasAccessToken() {
    return Boolean(getAccessToken());
}

export function getStoredUser(): StoredUser {
    if (typeof window === 'undefined') {
        return {
            username: '',
            realName: '',
            role: '',
        };
    }

    return {
        username: localStorage.getItem('username') || '',
        realName: localStorage.getItem('realName') || '',
        role: localStorage.getItem('role') || '',
    };
}

export function saveAuth(data: {
    token: string;
    username?: string;
    realName?: string;
    role?: string;
}) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username || '');
    localStorage.setItem('realName', data.realName || '');
    localStorage.setItem('role', data.role || '');
}

export function clearAuthStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    localStorage.removeItem('realName');
    localStorage.removeItem('role');
}