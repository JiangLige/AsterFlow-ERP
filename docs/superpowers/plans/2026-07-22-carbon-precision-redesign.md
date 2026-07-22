# AsterFlow ERP Carbon Precision Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current warm editorial AsterFlow ERP interface with a Carbon-based cold-white, graphite, electric-blue enterprise UI across login, dashboard, lists, forms, and detail pages without changing business behavior.

**Architecture:** Keep Next.js 14 Pages Router, React 18, the existing API layer, and every route. Add Carbon v11 once at the app root, move navigation and common states into focused shared components, then migrate page families in reviewable slices. Preserve the Rosette as a brand asset; use Carbon icons for all business UI.

**Tech Stack:** Next.js 14.2, React 18.3, TypeScript 5.4, `@carbon/react@^1.112.0`, Sass 1.101, Recharts 3.9, Vitest 4.1, Testing Library 16.3, jsdom 29.1.

## Global Constraints

- Preserve every existing URL, route filename, primary navigation label, form field name, field order, API path, request body, response type, auth behavior, and permission check.
- Use Carbon white theme with `#f4f4f4` page background, `#ffffff` layer, `#161616` primary text, `#525252` secondary text, `#c6c6c6` borders, and `#0f62fe` as the only brand action color.
- Use 0-2px radii, no generic card shadows, no warm beige, no orange accent, no gradient, and no decorative colored shadow.
- Keep Recharts but apply Carbon palette and typography.
- Use Carbon icons from `@carbon/react/icons` for business UI. The existing Tabler Rosette may remain only as the brand mark.
- Preserve Chinese copy as UTF-8. Do not translate Chinese source text to hide terminal mojibake.
- Support 1440px, 1024px, 768px, and 390px widths. Use `min-height: 100dvh`, never `100vh`.
- Every interactive element needs hover, active, disabled, focus-visible, loading, empty, and error behavior where applicable.
- Motion is feedback-only, 150-200ms, transform/opacity only, with `prefers-reduced-motion` fallback.
- Do not modify Spring Boot code, database files, API contracts, or business logic.
- Design source of truth: `docs/superpowers/specs/2026-07-22-carbon-precision-redesign-design.md`.

## File Structure

New shared files:

- `client/src/components/brand/BrandMark.tsx`: renders the preserved Rosette brand asset.
- `client/src/components/shell/navigation.ts`: owns module definitions and active-route helpers.
- `client/src/components/shell/AppHeader.tsx`: Carbon application header and mobile menu.
- `client/src/components/shell/ModuleNavigation.tsx`: contextual second-level navigation.
- `client/src/components/ui/PageHeader.tsx`: standard title, description, status, and actions.
- `client/src/components/ui/DataState.tsx`: skeleton, empty, and error states.
- `client/src/components/ui/StatusTag.tsx`: canonical business status mapping.
- `client/src/components/ui/OverflowActions.tsx`: compact row actions.
- `client/src/components/ui/FormActions.tsx`: save/cancel action bar.
- `client/src/components/ui/ConfirmActionModal.tsx`: controlled confirmation for destructive or state-changing actions.
- `client/src/components/ui/BusinessDataTable.tsx`: Carbon DataTable wrapper with toolbar, overflow container, and pagination.
- `client/src/components/orders/OrderItemsEditor.tsx`: Carbon item editor shared by purchase and sale forms.
- `client/src/components/orders/OrderDetailLayout.tsx`: shared order summary and line-item presentation.
- `client/src/lib/dashboard-view.ts`: pure dashboard metrics and chart projection.
- `client/src/styles/globals.scss`: Carbon import and AsterFlow theme/layout rules.
- `client/vitest.config.ts` and `client/src/test/setup.ts`: frontend test harness.

Existing page files remain the route owners and keep their data-loading and mutation functions.

---

### Task 1: Carbon Foundation and Test Harness

**Files:**
- Modify: `client/package.json`
- Modify: `package-lock.json`
- Create: `client/vitest.config.ts`
- Create: `client/src/test/setup.ts`
- Create: `client/src/styles/theme.test.ts`
- Rename: `client/src/styles/globals.css` to `client/src/styles/globals.scss`
- Modify: `client/src/pages/_app.tsx`

**Interfaces:**
- Consumes: existing Next.js `AppProps` and global stylesheet import.
- Produces: Carbon root theme, AsterFlow CSS variables, `npm run test -w client`.

- [ ] **Step 1: Install the exact runtime and test dependencies**

Run:

```powershell
npm install -w client @carbon/react@^1.112.0 sass@^1.101.3
npm install -D -w client vitest@^4.1.10 @testing-library/react@^16.3.2 @testing-library/jest-dom@^7.0.0 jsdom@^29.1.1
```

Expected: `client/package.json` and root `package-lock.json` update; npm exits 0.

- [ ] **Step 2: Add the client test command and Vitest configuration**

Add to `client/package.json` scripts:

```json
"test": "vitest run"
```

Create `client/vitest.config.ts`:

```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
```

Create `client/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  value: ResizeObserverStub,
  writable: true,
});
```

- [ ] **Step 3: Write the failing theme contract test**

Create `client/src/styles/theme.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AsterFlow Carbon theme', () => {
  const source = readFileSync(resolve(__dirname, 'globals.scss'), 'utf8');

  it('loads Carbon and locks the approved visual tokens', () => {
    expect(source).toContain("@use '@carbon/react'");
    expect(source).toContain('--aster-background: #f4f4f4');
    expect(source).toContain('--aster-text: #161616');
    expect(source).toContain('--aster-accent: #0f62fe');
    expect(source).not.toMatch(/#f7f3ec|#ee5a32/i);
  });
});
```

- [ ] **Step 4: Run the theme test to verify it fails**

Run:

```powershell
npm run test -w client -- src/styles/theme.test.ts
```

Expected: FAIL because `globals.scss` does not exist yet.

- [ ] **Step 5: Replace the global stylesheet with the Carbon foundation**

Run:

```powershell
git mv client/src/styles/globals.css client/src/styles/globals.scss
```

Replace the top-level theme and reset rules in `client/src/styles/globals.scss` with:

```scss
@use '@carbon/react';

:root {
  --aster-background: #f4f4f4;
  --aster-layer: #ffffff;
  --aster-layer-muted: #e8e8e8;
  --aster-text: #161616;
  --aster-text-secondary: #525252;
  --aster-border: #c6c6c6;
  --aster-accent: #0f62fe;
  --aster-header-height: 3rem;
  --aster-subnav-height: 2.5rem;
  --aster-content-max: 90rem;
}

*, *::before, *::after { box-sizing: border-box; }
html, body, #__next { min-height: 100%; }
html { background: var(--aster-background); color-scheme: light; }
body {
  margin: 0;
  background: var(--aster-background);
  color: var(--aster-text);
  font-family: 'IBM Plex Sans', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  line-height: 1.5;
  text-rendering: optimizeLegibility;
}

.numeric, [data-numeric='true'] {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

In this task, delete the old `:root` warm palette declarations and global body/background rules. Keep existing page-layout selectors temporarily so Tasks 2-9 remain reviewable while each owning component is migrated. Task 10 must delete the obsolete `.sidebar`, `.page-hero`, `.status-badge`, `.toolbar`, and `.login-visual` selectors. Do not retain any `#f7f3ec`, `#062849`, or `#ee5a32` declaration after this task.

Modify `client/src/pages/_app.tsx`:

```tsx
import type { AppProps } from 'next/app';
import { Theme } from '@carbon/react';
import '@/styles/globals.scss';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Theme theme="white">
      <Component {...pageProps} />
    </Theme>
  );
}
```

- [ ] **Step 6: Run tests and production build**

Run:

```powershell
npm run test -w client
npm run build:client
```

Expected: theme test PASS; Next.js production build exits 0.

- [ ] **Step 7: Commit the foundation**

```powershell
git add client/package.json package-lock.json client/vitest.config.ts client/src/test/setup.ts client/src/styles client/src/pages/_app.tsx
git commit -m "feat(client): add Carbon design foundation"
```

---

### Task 2: Top Application Shell and Navigation

**Files:**
- Create: `client/src/components/brand/BrandMark.tsx`
- Create: `client/src/components/shell/navigation.ts`
- Create: `client/src/components/shell/navigation.test.ts`
- Create: `client/src/components/shell/AppHeader.tsx`
- Create: `client/src/components/shell/ModuleNavigation.tsx`
- Modify: `client/src/components/Layout.tsx`
- Modify: `client/src/styles/globals.scss`

**Interfaces:**
- Consumes: Next router pathname, localStorage keys `token`, `username`, `realName`, `role`.
- Produces: `MODULES`, `getActiveModule(pathname)`, `isActiveRoute(pathname, href)`, authenticated top-nav layout.

- [ ] **Step 1: Write failing navigation tests**

Create `client/src/components/shell/navigation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getActiveModule, isActiveRoute, MODULES } from './navigation';

describe('AsterFlow navigation', () => {
  it('preserves every approved route label', () => {
    expect(MODULES.flatMap((module) => module.items.map((item) => item.label))).toEqual([
      '运营总览',
      '商品管理', '供应商', '客户管理',
      '采购订单', '销售订单', '库存预警', '库存流水',
      '审计日志',
    ]);
  });

  it('selects a module for nested routes', () => {
    expect(getActiveModule('/products/12/edit')?.key).toBe('master-data');
    expect(getActiveModule('/sale-orders/8')?.key).toBe('operations');
  });

  it('does not mark the dashboard active for every route', () => {
    expect(isActiveRoute('/products', '/')).toBe(false);
    expect(isActiveRoute('/products/3/edit', '/products')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the navigation test to verify it fails**

Run:

```powershell
npm run test -w client -- src/components/shell/navigation.test.ts
```

Expected: FAIL because `navigation.ts` does not exist.

- [ ] **Step 3: Implement the navigation model**

Create `client/src/components/shell/navigation.ts`:

```ts
export type NavigationItem = { href: string; label: string };
export type NavigationModule = {
  key: 'overview' | 'master-data' | 'operations' | 'system';
  label: string;
  items: NavigationItem[];
};

export const MODULES: NavigationModule[] = [
  { key: 'overview', label: '运营总览', items: [{ href: '/', label: '运营总览' }] },
  {
    key: 'master-data',
    label: '基础资料',
    items: [
      { href: '/products', label: '商品管理' },
      { href: '/suppliers', label: '供应商' },
      { href: '/customers', label: '客户管理' },
    ],
  },
  {
    key: 'operations',
    label: '业务流转',
    items: [
      { href: '/purchase-orders', label: '采购订单' },
      { href: '/sale-orders', label: '销售订单' },
      { href: '/inventory-warnings', label: '库存预警' },
      { href: '/stock-records', label: '库存流水' },
    ],
  },
  { key: 'system', label: '系统', items: [{ href: '/audit-logs', label: '审计日志' }] },
];

export function isActiveRoute(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveModule(pathname: string) {
  return MODULES.find((module) => module.items.some((item) => isActiveRoute(pathname, item.href)));
}
```

- [ ] **Step 4: Implement the preserved brand mark and Carbon header**

Create `client/src/components/brand/BrandMark.tsx`:

```tsx
import { IconRosette } from '@tabler/icons-react';

export default function BrandMark() {
  return <IconRosette aria-label="AsterFlow" size={24} stroke={1.8} />;
}
```

Create `client/src/components/shell/AppHeader.tsx` with these exact behaviors:

```tsx
import Link from 'next/link';
import { Header, HeaderGlobalAction, HeaderGlobalBar, HeaderMenuButton, HeaderNavigation } from '@carbon/react';
import { Logout, UserAvatar } from '@carbon/react/icons';
import BrandMark from '@/components/brand/BrandMark';
import { MODULES, getActiveModule } from './navigation';

type AppHeaderProps = {
  pathname: string;
  displayName: string;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onLogout: () => void;
};

export default function AppHeader(props: AppHeaderProps) {
  const activeModule = getActiveModule(props.pathname);
  return (
    <Header aria-label="AsterFlow ERP">
      <HeaderMenuButton aria-label="打开导航" isActive={props.mobileOpen} onClick={props.onToggleMobile} />
      <Link className="aster-brand" href="/" aria-label="返回运营总览">
        <BrandMark />
        <span>AsterFlow ERP</span>
      </Link>
      <HeaderNavigation aria-label="一级模块">
        {MODULES.map((module) => (
          <Link
            key={module.key}
            className="aster-module-link"
            data-active={activeModule?.key === module.key}
            href={module.items[0].href}
          >
            {module.label}
          </Link>
        ))}
      </HeaderNavigation>
      <HeaderGlobalBar>
        <div className="aster-user" title={props.displayName}>
          <UserAvatar size={20} />
          <span>{props.displayName}</span>
        </div>
        <HeaderGlobalAction aria-label="退出登录" onClick={props.onLogout}>
          <Logout size={20} />
        </HeaderGlobalAction>
      </HeaderGlobalBar>
    </Header>
  );
}
```

Create `ModuleNavigation.tsx` to render active-module items as Next links and mirror the same items inside the mobile panel. Use `aria-current="page"` only on `isActiveRoute(pathname, item.href)`.

- [ ] **Step 5: Recompose Layout without changing auth behavior**

Keep the existing `useEffect` token guard and `handleLogout` storage cleanup. Replace the sidebar render with:

```tsx
<div className="aster-app-shell">
  <a className="skip-link" href="#main-content">跳到主要内容</a>
  <AppHeader
    pathname={router.pathname}
    displayName={displayName}
    mobileOpen={mobileOpen}
    onToggleMobile={() => setMobileOpen((value) => !value)}
    onLogout={handleLogout}
  />
  <ModuleNavigation pathname={router.pathname} mobileOpen={mobileOpen} />
  <main id="main-content" className="aster-main">{children}</main>
</div>
```

Add `const [mobileOpen, setMobileOpen] = useState(false);`. The pre-auth loading state must use Carbon `InlineLoading description="正在准备运营工作台"`.

Add shell styles to `globals.scss`: fixed 48px header, 40px contextual nav, 1440px content max, visible skip-link on focus, single-line desktop navigation, and mobile panel below 768px.

- [ ] **Step 6: Run tests and build**

```powershell
npm run test -w client -- src/components/shell/navigation.test.ts
npm run build:client
```

Expected: 3 navigation tests PASS; every existing route builds.

- [ ] **Step 7: Commit the application shell**

```powershell
git add client/src/components client/src/styles/globals.scss
git commit -m "feat(client): replace sidebar with Carbon top navigation"
```

---

### Task 3: Shared Page, State, Status, Action, and Table Primitives

**Files:**
- Create: `client/src/components/ui/PageHeader.tsx`
- Create: `client/src/components/ui/DataState.tsx`
- Create: `client/src/components/ui/StatusTag.tsx`
- Create: `client/src/components/ui/StatusTag.test.tsx`
- Create: `client/src/components/ui/OverflowActions.tsx`
- Create: `client/src/components/ui/FormActions.tsx`
- Create: `client/src/components/ui/ConfirmActionModal.tsx`
- Create: `client/src/components/ui/BusinessDataTable.tsx`
- Create: `client/src/components/ui/BusinessDataTable.test.tsx`
- Modify: `client/src/styles/globals.scss`

**Interfaces:**
- Produces: `PageHeader`, `DataState`, `StatusTag`, `getStatusPresentation`, `OverflowActions`, `FormActions`, `ConfirmActionModal`, `BusinessDataTable`.
- Consumes: Carbon Button, Tag, InlineNotification, Modal, DataTable, TableSkeleton, Pagination.

- [ ] **Step 1: Write failing status and table tests**

`StatusTag.test.tsx` must assert:

```tsx
expect(getStatusPresentation('DRAFT')).toEqual({ label: '草稿', type: 'blue' });
expect(getStatusPresentation('APPROVED')).toEqual({ label: '已审核', type: 'green' });
expect(getStatusPresentation('CANCELED')).toEqual({ label: '已取消', type: 'red' });
expect(getStatusPresentation('INACTIVE')).toEqual({ label: '停用', type: 'gray' });
expect(getStatusPresentation('UNKNOWN')).toEqual({ label: 'UNKNOWN', type: 'gray' });
```

`BusinessDataTable.test.tsx` must render two headers and one row, then assert the header labels, row values, and `共 1 条` pagination summary are visible.

- [ ] **Step 2: Run tests to verify missing-module failures**

```powershell
npm run test -w client -- src/components/ui
```

Expected: FAIL because the shared modules do not exist.

- [ ] **Step 3: Implement the status contract**

Create `StatusTag.tsx`:

```tsx
import { Tag } from '@carbon/react';

const STATUS = {
  DRAFT: { label: '草稿', type: 'blue' },
  PROCESSING: { label: '处理中', type: 'blue' },
  APPROVED: { label: '已审核', type: 'green' },
  COMPLETED: { label: '已完成', type: 'green' },
  ACTIVE: { label: '启用', type: 'green' },
  CANCELED: { label: '已取消', type: 'red' },
  RISK: { label: '存在风险', type: 'red' },
  INACTIVE: { label: '停用', type: 'gray' },
} as const;

export function getStatusPresentation(status: string) {
  return STATUS[status as keyof typeof STATUS] ?? { label: status, type: 'gray' as const };
}

export default function StatusTag({ status }: { status: string }) {
  const presentation = getStatusPresentation(status);
  return <Tag type={presentation.type}>{presentation.label}</Tag>;
}
```

- [ ] **Step 4: Implement the remaining shared primitives**

Use these public props exactly:

```ts
export type PageHeaderProps = {
  title: string;
  description?: string;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
};

export type DataStateProps = {
  loading: boolean;
  error?: string;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  skeleton?: 'table' | 'text';
};

export type OverflowAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  danger?: boolean;
};

export type FormActionsProps = {
  submitting: boolean;
  submitLabel: string;
  cancelHref: string;
};

export type ConfirmActionModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  submitting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};
```

`BusinessDataTable` must accept Carbon-compatible `headers`, `rows`, a toolbar node, loading/empty/error props, and pagination props `{ page, pageSize, total, onChange }`. It must wrap the Carbon table in `.aster-table-scroll` and render `Pagination` immediately below the table.

`PageHeader` uses a real `<header>`, optional Next `Link` back action, and one action slot. `DataState` uses `TableSkeleton` for list loading, `SkeletonText` for content loading, and `InlineNotification` for errors. `ConfirmActionModal` uses Carbon `ComposedModal`, `ModalHeader`, `ModalBody`, and `ModalFooter` so page logic remains controlled.

- [ ] **Step 5: Add shared component styles**

Add `.aster-page-header`, `.aster-page-actions`, `.aster-toolbar`, `.aster-table-scroll`, `.aster-form-grid`, `.aster-form-actions`, `.aster-detail-grid`, and `.aster-state` rules. Use spacing and borders only; do not add box shadows or radii above 2px.

- [ ] **Step 6: Run component tests and build**

```powershell
npm run test -w client -- src/components/ui
npm run build:client
```

Expected: status and table tests PASS; build exits 0.

- [ ] **Step 7: Commit shared primitives**

```powershell
git add client/src/components/ui client/src/styles/globals.scss
git commit -m "feat(client): add Carbon business UI primitives"
```

---

### Task 4: Carbon Login Experience

**Files:**
- Modify: `client/src/pages/login.tsx`
- Create: `client/src/pages/login.test.tsx`
- Modify: `client/src/styles/globals.scss`

**Interfaces:**
- Consumes: POST `/api/login`; localStorage keys `token`, `username`, `realName`, `role`.
- Produces: same successful redirect to `/`, inline Carbon error state, responsive login surface.

- [ ] **Step 1: Write failing login behavior tests**

Mock `next/router` and `fetch`. Add two tests:

```tsx
it('stores the existing auth payload and redirects after success', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({
    success: true,
    data: { token: 'token-1', username: 'admin', realName: '张经理', role: 'ADMIN' },
  }), { status: 200 }));

  render(<LoginPage />);
  fireEvent.click(screen.getByRole('button', { name: '进入工作台' }));

  await waitFor(() => expect(localStorage.getItem('token')).toBe('token-1'));
  expect(push).toHaveBeenCalledWith('/');
});

it('renders an inline error without redirecting', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: false, message: '账号或密码错误' }), { status: 401 }));
  render(<LoginPage />);
  fireEvent.click(screen.getByRole('button', { name: '进入工作台' }));
  expect(await screen.findByText('账号或密码错误')).toBeVisible();
  expect(push).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run login tests to verify current markup fails**

```powershell
npm run test -w client -- src/pages/login.test.tsx
```

Expected: FAIL because the current button label and Carbon notification are absent.

- [ ] **Step 3: Replace only the login presentation layer**

Keep `handleLogin` request and storage lines intact. Replace the JSX with Carbon `Form`, `TextInput`, `PasswordInput`, `Button`, and `InlineNotification`:

```tsx
<main className="carbon-login">
  <section className="carbon-login__form" aria-labelledby="login-title">
    <div className="carbon-login__brand"><BrandMark /><strong>AsterFlow ERP</strong></div>
    <div className="carbon-login__content">
      <h1 id="login-title">登录运营工作台</h1>
      <p>使用你的 ERP 账号继续处理采购、销售和库存业务。</p>
      {error && <InlineNotification kind="error" title="登录失败" subtitle={error} hideCloseButton />}
      <Form onSubmit={handleLogin}>
        <TextInput id="username" labelText="用户名" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
        <PasswordInput id="password" labelText="密码" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        <Button type="submit" disabled={loading}>{loading ? '正在登录' : '进入工作台'}</Button>
      </Form>
      <p className="carbon-login__demo">演示账号：admin / 123456，staff / 123456</p>
    </div>
  </section>
  <aside className="carbon-login__brand-panel">
    <h2>让关键业务保持清晰。</h2>
    <dl>
      <div><dt>采购</dt><dd>订单审核与入库衔接</dd></div>
      <div><dt>销售</dt><dd>库存校验与出库追踪</dd></div>
      <div><dt>库存</dt><dd>风险预警与流水审计</dd></div>
    </dl>
  </aside>
</main>
```

Import `BrandMark` and Carbon components. Remove all business-use Tabler icon imports from this page.

- [ ] **Step 4: Add responsive login styles**

Use a 420px form column and flexible graphite panel on desktop. At `<768px`, hide the large panel, keep the form in the initial viewport, and move the three capability lines below the form as compact text. Ensure input labels and error text pass WCAG AA.

- [ ] **Step 5: Run login tests and build**

```powershell
npm run test -w client -- src/pages/login.test.tsx
npm run build:client
```

Expected: both login tests PASS; `/login` builds.

- [ ] **Step 6: Commit login redesign**

```powershell
git add client/src/pages/login.tsx client/src/pages/login.test.tsx client/src/styles/globals.scss
git commit -m "feat(client): redesign login with Carbon"
```

---

### Task 5: Operations Dashboard

**Files:**
- Create: `client/src/lib/dashboard-view.ts`
- Create: `client/src/lib/dashboard-view.test.ts`
- Modify: `client/src/pages/index.tsx`
- Modify: `client/src/styles/globals.scss`

**Interfaces:**
- Consumes: existing `DashboardSummary` fields and `/api/dashboard-summary`.
- Produces: `buildDashboardView(summary)` with metrics, pending tasks, chart rows, and movement rows.

- [ ] **Step 1: Write the failing dashboard projection test**

Use a full summary fixture and assert:

```ts
const view = buildDashboardView({
  productCount: 128, warningProductCount: 6,
  purchaseApprovedCount: 36, purchaseCanceledCount: 4, purchaseDraftCount: 5,
  todayPurchaseOrderCount: 8, todayPurchaseAmount: 215480, todayInQuantity: 420,
  saleApprovedCount: 42, saleCanceledCount: 3, saleDraftCount: 3,
  todaySaleOrderCount: 12, todaySaleAmount: 328760.5, todayOutQuantity: 286,
});

expect(view.pendingCount).toBe(8);
expect(view.metrics.map((item) => item.label)).toEqual(['今日销售额', '今日采购额', '待审核订单', '库存风险商品']);
expect(view.orderStatus).toEqual([
  { status: '草稿', purchase: 5, sale: 3 },
  { status: '已审核', purchase: 36, sale: 42 },
  { status: '已取消', purchase: 4, sale: 3 },
]);
```

- [ ] **Step 2: Run the projection test to verify it fails**

```powershell
npm run test -w client -- src/lib/dashboard-view.test.ts
```

Expected: FAIL because `dashboard-view.ts` does not exist.

- [ ] **Step 3: Implement the typed dashboard projection**

Move `DashboardSummary` into `dashboard-view.ts`, export it, and implement `buildDashboardView` without inventing history data. Metric values must use existing currency/number formatters. Task rows must link to `/purchase-orders`, `/sale-orders`, and `/inventory-warnings`. Movement rows must use `todayInQuantity`, `todayPurchaseAmount`, `todayOutQuantity`, and `todaySaleAmount`.

- [ ] **Step 4: Recompose the dashboard page**

Keep `loadDashboard()` and the API path unchanged. Render:

```tsx
<Layout>
  <PageHeader
    title={`运营总览，${displayName}`}
    description={formatDate()}
    actions={<Button renderIcon={Add} href="/purchase-orders/new">新建采购单</Button>}
  />
  <DataState loading={loading && !data} error={error} onRetry={loadDashboard} skeleton="text" />
  {data && (
    <>
      <section className="metric-strip">...</section>
      <section className="dashboard-grid">
        <article className="task-queue">...</article>
        <article className="order-chart">...</article>
        <article className="movement-table">...</article>
      </section>
    </>
  )}
</Layout>
```

When Carbon `Button` cannot render a Next link directly, wrap a Next `Link` with Carbon button classes rather than changing navigation behavior. Replace all Tabler business icons with imports from `@carbon/react/icons`. Style Recharts with `#0f62fe`, `#4589ff`, `#8d8d8d`, Carbon grid lines, and IBM Plex typography.

- [ ] **Step 5: Add dashboard responsive rules**

Use `grid-template-columns: minmax(20rem, .8fr) minmax(32rem, 1.2fr)` above 1024px. The movement table spans the right column below the chart. At 1024px and below, stack sections in task, chart, movement order. At 390px, metrics use two columns and all chart labels remain readable.

- [ ] **Step 6: Run tests and build**

```powershell
npm run test -w client -- src/lib/dashboard-view.test.ts
npm run build:client
```

Expected: projection test PASS; dashboard build exits 0.

- [ ] **Step 7: Commit dashboard redesign**

```powershell
git add client/src/lib/dashboard-view.ts client/src/lib/dashboard-view.test.ts client/src/pages/index.tsx client/src/styles/globals.scss
git commit -m "feat(client): rebuild operations dashboard"
```

---

### Task 6: Master Data Lists

**Files:**
- Modify: `client/src/pages/products.tsx`
- Modify: `client/src/pages/suppliers.tsx`
- Modify: `client/src/pages/customers.tsx`
- Modify: `client/src/styles/globals.scss`

**Interfaces:**
- Consumes: `BusinessDataTable`, `PageHeader`, `DataState`, `StatusTag`, `OverflowActions`, `ConfirmActionModal`.
- Produces: Carbon list pages with unchanged query and mutation calls.

- [ ] **Step 1: Add a failing product-page rendering test**

Create `client/src/pages/products.test.tsx`. Mock `apiRequest` to return one product, set `role=ADMIN`, render the page, and assert the following are present: `商品管理`, `SP-100398`, `¥268.00`, `启用`, and one row overflow-menu button. Assert the visible row does not contain three separately displayed action buttons.

- [ ] **Step 2: Run the product-page test to verify it fails**

```powershell
npm run test -w client -- src/pages/products.test.tsx
```

Expected: FAIL because the current page renders flat action links/buttons.

- [ ] **Step 3: Migrate the product list**

Keep `loadProducts` and delete request unchanged. Map products to these exact keys:

```tsx
const rows = products.map((product) => ({
  id: String(product.id),
  code: <span className="numeric">{product.productCode}</span>,
  name: product.name,
  category: product.category,
  unit: product.unit,
  price: <span className="numeric">{formatCurrency(product.price)}</span>,
  cost: <span className="numeric">{formatCurrency(product.cost)}</span>,
  stock: <strong data-risk={product.stock <= product.minStock}>{product.stock}</strong>,
  minStock: product.minStock,
  status: <StatusTag status={product.status} />,
  actions: <OverflowActions actions={productActions(product, role)} />,
}));
```

Headers: 编码、名称、分类、单位、售价、成本、库存、最低库存、状态、操作. Use `ConfirmActionModal` for the current delete confirmation and keep ADMIN visibility.

- [ ] **Step 4: Migrate supplier and customer lists**

Supplier row keys: supplierCode, name, contactName, phone, address, status, actions. Preserve ADMIN-only active/inactive actions and their PATCH paths.

Customer row keys: customerCode, name, contactName, phone, address, status, actions. Preserve ADMIN-only delete and its DELETE path.

Both pages use a Carbon `Search` control in the table toolbar, `PageHeader` with the existing create route, `StatusTag`, `Pagination`, `DataState`, and controlled confirmation modals. Do not change query parameter names `page`, `size`, or `keyword`.

- [ ] **Step 5: Run page tests and build**

```powershell
npm run test -w client -- src/pages/products.test.tsx
npm run build:client
```

Expected: product test PASS; products, suppliers, and customers routes build.

- [ ] **Step 6: Commit master data lists**

```powershell
git add client/src/pages/products.tsx client/src/pages/products.test.tsx client/src/pages/suppliers.tsx client/src/pages/customers.tsx client/src/styles/globals.scss
git commit -m "feat(client): migrate master data lists to Carbon"
```

---

### Task 7: Orders, Inventory, and Audit Lists

**Files:**
- Modify: `client/src/pages/purchase-orders.tsx`
- Modify: `client/src/pages/sale-orders.tsx`
- Modify: `client/src/pages/inventory-warnings.tsx`
- Modify: `client/src/pages/stock-records.tsx`
- Modify: `client/src/pages/audit-logs.tsx`
- Modify: `client/src/styles/globals.scss`

**Interfaces:**
- Consumes: shared table/state/action components from Task 3.
- Produces: all remaining list pages using one Carbon table language.

- [ ] **Step 1: Write a failing order-actions test**

Create `client/src/pages/purchase-orders.test.tsx`. Mock one DRAFT order for ADMIN. Assert the row shows status `草稿`; the overflow menu exposes `查看`, `编辑`, `审核通过`, and `删除`; and approving calls `PATCH /api/purchase-orders/7/approve` only after confirmation.

- [ ] **Step 2: Run the test to verify the current action presentation fails**

```powershell
npm run test -w client -- src/pages/purchase-orders.test.tsx
```

Expected: FAIL because the current page uses flat action buttons and `window.confirm`.

- [ ] **Step 3: Migrate purchase and sale order lists**

Use the same headers for both page families: 单号、往来单位、金额、状态、备注、创建时间、操作. Preserve status filters and query parameter `status`.

Purchase action contract:

```ts
DRAFT: ['查看', '编辑', '审核通过', ADMIN ? '删除' : null]
APPROVED: ['查看', '取消订单']
CANCELED: ['查看']
```

Sale action contract:

```ts
DRAFT: ['查看', '编辑', '审核通过', ADMIN ? '删除' : null]
APPROVED: ['查看', '取消订单']
CANCELED: ['查看']
```

Keep all existing PATCH and DELETE URLs. Replace each `window.confirm` with `ConfirmActionModal` whose description states stock impact for approve/cancel actions.

- [ ] **Step 4: Migrate inventory warnings**

Render headers 编码、名称、分类、单位、当前库存、最低库存、状态. Use `StatusTag status="RISK"` for warning semantics while retaining the underlying product status in accessible text. The page has a retry button and a clear empty state: `当前没有低于安全库存的商品`.

- [ ] **Step 5: Migrate stock records and audit logs**

Stock records keep `keyword` and `type` filters and columns 时间、商品、类型、变更数量、变更后库存、来源单据、备注. Audit logs keep `keyword`, `action`, and `targetType` filters and columns 时间、操作人、动作、对象、对象编号、描述. Use Carbon `Search`, `Select`, `BusinessDataTable`, and `Pagination` without changing API query names.

- [ ] **Step 6: Run tests and build**

```powershell
npm run test -w client -- src/pages/purchase-orders.test.tsx
npm run build:client
```

Expected: purchase order test PASS; all five list routes build.

- [ ] **Step 7: Commit transactional lists**

```powershell
git add client/src/pages/purchase-orders.tsx client/src/pages/purchase-orders.test.tsx client/src/pages/sale-orders.tsx client/src/pages/inventory-warnings.tsx client/src/pages/stock-records.tsx client/src/pages/audit-logs.tsx client/src/styles/globals.scss
git commit -m "feat(client): migrate operations lists to Carbon"
```

---

### Task 8: Product, Supplier, Customer, and Stock Forms

**Files:**
- Modify: `client/src/pages/products/new.tsx`
- Modify: `client/src/pages/products/[id]/edit.tsx`
- Modify: `client/src/pages/products/[id]/stock.tsx`
- Modify: `client/src/pages/suppliers/new.tsx`
- Modify: `client/src/pages/suppliers/[id]/edit.tsx`
- Modify: `client/src/pages/customers/new.tsx`
- Modify: `client/src/pages/customers/[id]/edit.tsx`
- Create: `client/src/pages/products/new.test.tsx`
- Modify: `client/src/styles/globals.scss`

**Interfaces:**
- Consumes: Carbon Form, TextInput, NumberInput, Select, TextArea, InlineNotification, `PageHeader`, `FormActions`, `DataState`.
- Produces: seven forms with unchanged field names, order, validation, payloads, and routes.

- [ ] **Step 1: Write a failing product-form contract test**

Render `ProductCreatePage`, fill 商品编码 and 商品名称, submit, then assert the request body still contains exact keys:

```ts
expect(JSON.parse(requestInit.body as string)).toEqual({
  productCode: 'SP-900001',
  name: '测试商品',
  category: '',
  unit: '',
  price: 0,
  cost: 0,
  stock: 0,
  status: 'ACTIVE',
  description: '',
});
```

Also assert labels remain visible above inputs and the submit button says `保存商品`.

- [ ] **Step 2: Run the test to verify the new contract UI is absent**

```powershell
npm run test -w client -- src/pages/products/new.test.tsx
```

Expected: FAIL on the new submit label or Carbon field structure.

- [ ] **Step 3: Migrate product create and edit forms**

Use the existing state and `handleSubmit` bodies. Render fields in this unchanged order: 商品编码、商品名称、分类、单位、售价、成本价、库存、状态、描述. Use `TextInput`, `NumberInput`, `Select`, and `TextArea`. Product edit keeps its load state and PUT path. Both pages use `FormActions`; cancel returns to `/products`.

- [ ] **Step 4: Migrate stock adjustment**

Keep type, quantity, and remark behavior plus `getChangeQuantity`. Use Carbon `RadioButtonGroup` for IN/OUT/ADJUST, `NumberInput` for quantity, and `TextArea` for remark. Render success and error as inline notifications. The submit button label is `确认调整` and cancel returns to `/products`.

- [ ] **Step 5: Migrate supplier and customer forms**

Supplier order remains 供应商编码、供应商名称、联系人、电话、地址、状态. Customer order remains 客户编码、客户名称、联系人、电话、地址、状态. Create routes keep POST; edit routes keep existing load and PUT calls. Use `FormActions` with `保存供应商` or `保存客户`; cancel returns to the matching list.

- [ ] **Step 6: Apply form layout and mobile rules**

Use `.aster-form-grid` with two columns above 768px, one column below. Description/address fields span both columns. Use a sticky bottom action bar that does not cover the final field. All labels, helper text, errors, and focus rings must meet WCAG AA.

- [ ] **Step 7: Run tests and build**

```powershell
npm run test -w client -- src/pages/products/new.test.tsx
npm run build:client
```

Expected: product form test PASS; all seven form routes build.

- [ ] **Step 8: Commit master data forms**

```powershell
git add client/src/pages/products client/src/pages/suppliers client/src/pages/customers client/src/styles/globals.scss
git commit -m "feat(client): migrate master data forms to Carbon"
```

---

### Task 9: Purchase and Sale Order Editors and Details

**Files:**
- Create: `client/src/components/orders/OrderItemsEditor.tsx`
- Create: `client/src/components/orders/OrderItemsEditor.test.tsx`
- Create: `client/src/components/orders/OrderDetailLayout.tsx`
- Modify: `client/src/pages/purchase-orders/new.tsx`
- Modify: `client/src/pages/purchase-orders/[id]/edit.tsx`
- Modify: `client/src/pages/purchase-orders/[id].tsx`
- Modify: `client/src/pages/sale-orders/new.tsx`
- Modify: `client/src/pages/sale-orders/[id]/edit.tsx`
- Modify: `client/src/pages/sale-orders/[id].tsx`
- Modify: `client/src/styles/globals.scss`

**Interfaces:**
- Produces: `OrderItemsEditor<Item>` and `OrderDetailLayout`.
- Consumes: existing item arrays and update/remove/add callbacks owned by route pages.

- [ ] **Step 1: Write a failing order-items editor test**

Render one item and assert:

```tsx
expect(screen.getByLabelText('商品')).toHaveValue('3');
expect(screen.getByLabelText('数量')).toHaveValue(2);
expect(screen.getByLabelText('单价')).toHaveValue(18.5);
fireEvent.click(screen.getByRole('button', { name: '删除明细 1' }));
expect(onRemove).toHaveBeenCalledWith(0);
```

- [ ] **Step 2: Run the test to verify the component is missing**

```powershell
npm run test -w client -- src/components/orders/OrderItemsEditor.test.tsx
```

Expected: FAIL because `OrderItemsEditor.tsx` does not exist.

- [ ] **Step 3: Implement the shared item editor**

Use this interface:

```ts
export type EditableOrderItem = { productId: string; quantity: string | number; price: string | number };
export type ProductOption = { id: number; productCode: string; name: string; price?: number; cost?: number; stock?: number };
export type OrderItemsEditorProps<T extends EditableOrderItem> = {
  items: T[];
  products: ProductOption[];
  priceLabel: string;
  onAdd: () => void;
  onChange: (index: number, field: keyof T, value: string) => void;
  onRemove: (index: number) => void;
};
```

Render a Carbon table with product Select, quantity NumberInput, price NumberInput, computed amount, and icon-only delete button with `aria-label="删除明细 ${index + 1}"`. Keep the route page as owner of all normalization and validation.

- [ ] **Step 4: Migrate purchase create and edit pages**

Keep supplier loading, product loading, `normalizedItems`, validation, POST/PUT paths, and redirects unchanged. Replace the visual item rows with `OrderItemsEditor`. Page field order: 供应商、备注、商品明细. Use `FormActions` and display inline errors.

- [ ] **Step 5: Migrate sale create and edit pages**

Keep customer loading, stock validation, `normalizedItems`, POST/PUT paths, and redirects unchanged. Replace only presentation with the same editor. Page field order: 客户、备注、商品明细.

- [ ] **Step 6: Implement and use the detail layout**

`OrderDetailLayout` accepts:

```ts
type OrderDetailLayoutProps = {
  title: string;
  backHref: string;
  status: string;
  summary: Array<{ label: string; value: React.ReactNode; numeric?: boolean }>;
  items: Array<{ id: number; productCode: string; productName: string; quantity: number; price: number; amount: number }>;
};
```

Purchase detail summary labels: 单号、供应商、状态、总金额、创建时间、备注. Sale detail summary labels: 单号、客户、状态、总金额、创建时间、备注. Both use `StatusTag`, grouped definition lists, and Carbon Table for item details. Preserve existing data loading and error paths.

- [ ] **Step 7: Run tests and build**

```powershell
npm run test -w client -- src/components/orders/OrderItemsEditor.test.tsx
npm run build:client
```

Expected: editor test PASS; all six order routes build.

- [ ] **Step 8: Commit order forms and details**

```powershell
git add client/src/components/orders client/src/pages/purchase-orders client/src/pages/sale-orders client/src/styles/globals.scss
git commit -m "feat(client): migrate order workflows to Carbon"
```

---

### Task 10: Responsive, Accessibility, Dependency Cleanup, and Final QA

**Files:**
- Modify: `client/src/styles/globals.scss`
- Modify: `client/src/pages/_document.tsx`
- Modify: `client/package.json`
- Modify: `package-lock.json`
- Modify: `design-qa.md`
- Verify: every file under `client/src/pages/**/*.tsx`

**Interfaces:**
- Consumes: all migrated UI.
- Produces: verified production build, clean dependency graph, Carbon redesign QA evidence.

- [ ] **Step 1: Add a static pre-flight test**

Create `client/src/styles/preflight.test.ts` that scans page/component TSX and SCSS files and asserts:

```ts
expect(source).not.toMatch(/#f7f3ec|#062849|#ee5a32/i);
expect(source).not.toMatch(/Icon(AlertTriangle|ArrowRight|ArrowsExchange|BuildingWarehouse|ClipboardCheck|Refresh|ShoppingCart)/);
expect(source).not.toMatch(/style=\{\{/);
expect(source).not.toMatch(/[—–]/);
```

Exclude `BrandMark.tsx` from the Tabler scan. Inline style matches must be removed from migrated UI, not from unrelated server code.

- [ ] **Step 2: Run pre-flight to expose remaining migration debt**

```powershell
npm run test -w client -- src/styles/preflight.test.ts
```

Expected: FAIL with exact remaining old token, Tabler business icon, inline style, or dash locations.

- [ ] **Step 3: Remove remaining old UI and dependencies**

Replace all remaining business-use Tabler imports with `@carbon/react/icons`. Keep only `IconRosette` in `BrandMark.tsx`. If no other Tabler import remains, keep `@tabler/icons-react` solely for the approved brand exception and document that fact in `client/package.json` dependency review notes in the commit message. Remove obsolete `.sidebar`, `.page-hero`, `.status-badge`, `.toolbar`, `.login-visual`, and warm palette rules from `globals.scss`.

Update `_document.tsx` to retain `lang="zh-CN"`, set `theme-color` to `#161616`, and preserve existing meta content.

- [ ] **Step 4: Run automated validation**

```powershell
npm run test -w client
npm run build:client
git diff --check
```

Expected: all Vitest tests PASS; 25 frontend pages generate; diff check exits 0 with no whitespace errors.

- [ ] **Step 5: Run browser interaction and responsive QA**

Start the app with the existing scripts. Validate these exact states in the user-selected browser:

1. `/login` at 1440x900 and 390x844.
2. `/` with a valid local test session and realistic dashboard response at 1440x900, 1024x768, and 390x844.
3. `/products` with five realistic records; query, pagination, status tag, overflow actions, and horizontal containment.
4. `/products/new`; label/input associations, two-column desktop layout, one-column mobile layout, submit loading state.
5. `/purchase-orders`; filter, approve confirmation, cancel confirmation, and role visibility.
6. `/purchase-orders/new`; add row, edit quantity/price, remove row, validation error.
7. Keyboard traversal through skip link, top modules, contextual nav, table actions, and form fields.
8. Browser console contains zero errors and zero warnings caused by the redesign.

- [ ] **Step 6: Update design QA evidence**

Replace the previous warm-theme evidence in `design-qa.md` with:

- approved Carbon spec path;
- desktop and mobile screenshot paths;
- tested routes and viewport sizes;
- interaction results;
- console result;
- deviations, if any, with severity and resolution;
- final line exactly `final result: passed` only when no P0, P1, or P2 issue remains.

- [ ] **Step 7: Run final full-repository validation**

```powershell
npm run test -w client
npm run build:client
server\.\mvnw.cmd -B test
git status --short
```

Expected: frontend tests PASS, Next build PASS, backend tests PASS, and status shows only intended redesign and QA files.

- [ ] **Step 8: Commit final cleanup and QA**

```powershell
git add client package-lock.json design-qa.md
git commit -m "test(client): verify Carbon redesign"
```

---

## Plan Self-Review Result

- Spec coverage: all global shell, login, dashboard, list, form, detail, state, responsive, accessibility, dependency, and verification requirements map to Tasks 1-10.
- Placeholder scan: no unfinished marker, vague deferred-work instruction, or undefined interface remains.
- Type consistency: `StatusTag`, `DataState`, `BusinessDataTable`, `FormActions`, `ConfirmActionModal`, `OrderItemsEditor`, and `OrderDetailLayout` signatures are defined before consumers use them.
- Scope: frontend-only; no server, database, route, API, or business behavior change is planned.
