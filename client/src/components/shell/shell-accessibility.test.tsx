import { fireEvent, render, screen, within } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import AppHeader from './AppHeader';
import ModuleNavigation from './ModuleNavigation';

describe('Carbon shell accessibility', () => {
  it('labels and associates the menu button with its current state', () => {
    const onToggleMobile = vi.fn();
    const props = {
      pathname: '/products',
      displayName: '测试用户',
      onToggleMobile,
      onLogout: vi.fn(),
    };
    const { rerender } = render(createElement(AppHeader, { ...props, mobileOpen: false }));

    const openButton = screen.getByRole('button', { name: '打开导航' });
    expect(openButton).toHaveAttribute('aria-controls', 'aster-mobile-navigation');
    fireEvent.click(openButton);
    expect(onToggleMobile).toHaveBeenCalledOnce();

    rerender(createElement(AppHeader, { ...props, mobileOpen: true }));
    expect(screen.getByRole('button', { name: '关闭导航' })).toHaveAttribute(
      'aria-controls',
      'aster-mobile-navigation',
    );
  });

  it('closes mobile navigation after choosing a link', () => {
    const onNavigate = vi.fn();
    render(createElement(ModuleNavigation, {
      pathname: '/products',
      mobileOpen: true,
      onNavigate,
    }));

    const panel = document.getElementById('aster-mobile-navigation');
    expect(panel).not.toBeNull();
    const mobileLink = within(panel as HTMLElement).getByRole('link', { name: '商品管理' });
    mobileLink.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(mobileLink);

    expect(onNavigate).toHaveBeenCalledOnce();
  });
});
