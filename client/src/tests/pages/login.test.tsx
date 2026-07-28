import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/pages/login';

const { push } = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/router', () => ({
  useRouter: () => ({ push }),
}));

const fetchMock = vi.fn<typeof fetch>();

describe('Carbon login experience', () => {
  beforeEach(() => {
    push.mockReset();
    fetchMock.mockReset();
    localStorage.clear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('stores the existing auth payload and redirects after success', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: {
        token: 'token-1',
        username: 'admin',
        realName: '张经理',
        role: 'ADMIN',
      },
    }), { status: 200 }));

    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: '进入工作台' }));

    await waitFor(() => expect(localStorage.getItem('token')).toBe('token-1'));
    expect(localStorage.getItem('username')).toBe('admin');
    expect(localStorage.getItem('realName')).toBe('张经理');
    expect(localStorage.getItem('role')).toBe('ADMIN');
    expect(fetchMock).toHaveBeenCalledWith('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'admin', password: '123456' }),
    });
    expect(push).toHaveBeenCalledWith('/');
  });

  it('renders an inline error without redirecting', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      success: false,
      message: '账号或密码错误',
    }), { status: 401 }));

    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: '进入工作台' }));

    expect(await screen.findByText('账号或密码错误')).toBeVisible();
    expect(screen.getByText('登录失败').closest('.cds--inline-notification')).not.toBeNull();
    expect(push).not.toHaveBeenCalled();
  });
});
