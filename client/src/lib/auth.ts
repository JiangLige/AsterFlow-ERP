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

export function getCurrentUserDisplay() {
    if (typeof window === 'undefined') {
        return {
            displayName: '',
            role: '',
        };
    }

    return {
        displayName: localStorage.getItem('realName') || localStorage.getItem('username') || '',
        role: localStorage.getItem('role') || '',
    };
}

export function clearAuthStorage() {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('realName');
    localStorage.removeItem('role');
}