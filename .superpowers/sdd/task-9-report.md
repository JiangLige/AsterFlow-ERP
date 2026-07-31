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

## Review Follow-up: Order Workflow Hardening

### RED

- Ran `npm run test -w client -- src/components/orders/OrderItemsEditor.test.tsx src/tests/pages/order-workflows.test.tsx` after adding the review cases.
- The focused suite failed in three expected places: the sole-row delete control was enabled, and purchase and sale create forms rendered while required options were still loading.
- The prior edit regression only asserted that a PUT request existed and redirected. It did not parse `RequestInit.body`, so a changed supplier or customer id, remark, or normalized item payload would have passed the old test. The new assertions parse and compare both complete PUT payloads.
- The prior stock test used one line item only. The new create and edit cases use two rows with the same `productId`, each individually valid but cumulatively over stock, and assert no POST or PUT is sent.

### GREEN

- Added `disableOutOfStockOptions` to the shared editor for sale routes, preserving purchase behavior while disabling `stock <= 0` options before selection.
- Disabled the icon-only delete control when there is one line item and provided its Carbon icon description.
- Added explicit loading and empty DataState gates to all four create and edit pages. Forms, submission, and add-item controls do not render until the required party and product option requests succeed with non-empty records.
- Kept field validation, normalized payloads, cumulative stock checks, API methods and paths, and redirects in the route pages.

### Follow-up Verification

- Focused tests: 2 files, 14 tests passed.
- Full client suite: 18 files, 81 tests passed.
- `npm run build:client`: passed after the follow-up.
- `git diff --check` and client static constraints: passed.
