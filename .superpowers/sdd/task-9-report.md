# Task 9 Report: Order Workflow Carbon Migration

## Scope

- Added `OrderItemsEditor` and `OrderDetailLayout`.
- Migrated purchase and sale create, edit, and detail pages to Carbon form, table, notification, state, and status primitives.
- Kept route-level normalization, stock validation, request paths, methods, payloads, loading, and redirects in their existing route pages.

## TDD Evidence

- RED: `npm run test -w client -- src/components/orders/OrderItemsEditor.test.tsx`
  failed because `OrderItemsEditor.tsx` did not exist.
- GREEN: the same test passed after the minimal editor implementation.
- The editor test uses the real Carbon controls and verifies select, quantity, price, and delete callbacks.

## Regression Coverage

- Added `client/src/tests/pages/order-workflows.test.tsx`.
- Purchase create verifies the exact normalized POST payload and redirect.
- Sale create verifies stock blocking plus the normalized POST payload.
- Purchase and sale edit verify GET then PUT paths and detail redirects.
- Detail pages verify load, error, and required summary labels.

## Verification

- Focused tests: 2 files, 5 tests passed.
- Full client suite: 18 files, 72 tests passed.
- `npm run build:client`: passed, including type checks and all route generation.
- `git diff --check`: passed.
- Static audit passed for newly added forbidden patterns: inline styles, `100vh`, gradients, shadows, warm palette values, and em dashes.
- Manual source review confirmed the purchase and sale route API methods, paths, normalized payloads, stock aggregation validation, redirects, semantic labels, Carbon table scrolling, and mobile rules remain present.

## Concerns

- None. Route-level tests intentionally mock shared presentation components so they assert workflow contracts independently from Carbon rendering. `OrderItemsEditor` itself is tested without that mock.
