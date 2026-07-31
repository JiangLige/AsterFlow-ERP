# Task 10 Report: Carbon Precision Final QA

## Status

`DONE_WITH_CONCERNS`

The Carbon redesign has no remaining P0, P1, or P2 issue. The only retained
concern is an external P3 test-data encoding condition in the already-running
local database: authenticated user real names are returned as question marks,
while the checked-in seed source still contains the intended Chinese names.

## Static preflight and cleanup

Added `client/src/styles/preflight.test.ts` to scan page and component TSX plus
SCSS sources for the migration constraints. `BrandMark.tsx` is excluded only
from the Tabler business-icon scan.

### RED

`npm run test -w client -- src/styles/preflight.test.ts`

- Result: 1 failed, 3 passed.
- Exact remaining debt:
  `pages/_document.tsx:7: #062849`

Before removing obsolete stylesheet rules, a consumer search confirmed that
`.page-hero`, `.toolbar`, and `.status-badge` remained only as unused CSS.
`.sidebar`, `.login-visual`, and retired warm palette values were already
absent. The only Tabler import was the approved `IconRosette` brand exception.

### GREEN

- Updated the document theme color to `#161616` while retaining
  `lang="zh-CN"` and the existing meta content.
- Removed the unused page-hero, toolbar, and status-badge rules and their
  responsive variants.
- Preserved the still-consumed `.page-actions` rules.
- Re-ran the preflight: 4 tests passed.

## Browser-discovered regressions

Every material browser finding received an automated regression before the
implementation change.

| RED finding | Test protection | GREEN and browser retest |
| --- | --- | --- |
| The 390px menu exposed only the active context. | `shell-accessibility.test.tsx` requires all four module groups and all nine links. | Mobile navigation now exposes the complete grouped route set in a bounded, scrollable panel. |
| Confirmation dialogs had no accessible landmark name. | `primitives.test.tsx` queries the dialog by its visible title. | `ConfirmActionModal` assigns the title as the modal accessible name; approve and cancel dialogs passed. |
| Activating the skip link left focus on `body`. | `shell-contract.test.ts` requires a focusable `main#main-content`. | The main region now accepts programmatic focus; the link moved focus to the main landmark. |
| The purchase-order toolbar expanded into a large empty block. | `theme.test.ts` requires the compact desktop grid and single-column mobile rule. | The operations toolbar now uses a compact search, filter, action grid and was recaptured after retest. |

Focused RED runs failed at the new expectation in each case. Their paired GREEN
runs passed before the next change was started.

## Browser QA matrix

Testing used isolated headless Google Chrome, a fresh browser context, UI login,
`zh-CN`, light color scheme, and reduced motion.

| Route | Viewports | Result |
| --- | --- | --- |
| `/login` | 1440x900, 390x844 | Responsive split/card layouts, labels, and UI authentication passed. |
| `/` | 1440x900, 1024x768, 390x844 | Header, module hierarchy, contextual navigation, metric strip, primary action, and containment passed. |
| `/products` | 1440x900 and 390px containment check | Five records, query/clear, page size, status tags, overflow actions, keyboard menu use, and Carbon-owned horizontal table scrolling passed. |
| `/products/new` | 1440x900, 390x844 | Label associations, desktop two-column layout, mobile one-column layout, sticky actions, and submit loading state passed. |
| `/purchase-orders` | 1440x900 | Status/keyword filters, draft/approved/canceled states, approve/cancel dialogs, and admin/staff role visibility passed. |
| `/purchase-orders/new` | 1440x900 | Add, edit, amount recalculation, remove, validation alert, and no-invalid-submit checks passed. |

Keyboard traversal covered the skip link, top modules, contextual navigation,
table overflow actions, form fields, and action buttons.

## Controlled browser fixtures

Browser-only route interception supplied states that the current local database
could not provide, without changing source or backend data:

- Product GET: four current seeded products plus one inactive, out-of-stock
  keyboard, for the required five-record list.
- Product POST: a held and browser-fulfilled response to inspect the disabled
  loading state without creating a record.
- Purchase-order GET: one draft, one approved, and one canceled order because
  the current database returned an empty list.
- No approve, cancel, delete, or create mutation was confirmed against the
  backend.

## Screenshot evidence

All evidence is under `docs/superpowers/qa/carbon-precision/`:

- `login-desktop.jpg`
- `login-mobile.jpg`
- `dashboard-desktop.jpg`
- `dashboard-tablet.jpg`
- `dashboard-mobile.jpg`
- `products-desktop.jpg`
- `product-form-desktop.jpg`
- `product-form-mobile.jpg`
- `purchase-orders-desktop.jpg`
- `purchase-order-form-desktop.jpg`

The root `design-qa.md` contains the complete viewport-to-file mapping and its
last line is `final result: passed`.

## Console, network, and accessibility

- Final browser route checks: zero console errors, zero console warnings, zero
  page errors, zero request failures, and zero HTTP responses at or above 400.
- Verified rendered landmarks, heading order, dialog names, label associations,
  focus order, keyboard table actions, and responsive containment.
- Static preflight: no retired warm token, forbidden business-use Tabler icon,
  inline style object, or en/em dash remains in its scanned migration scope.

## Dependency decision

`@tabler/icons-react` remains solely for the approved `BrandMark.tsx`
`IconRosette` exception. Business icons are Carbon icons. Therefore
`client/package.json` and `package-lock.json` correctly remain unchanged.

## Final automated verification

- `npm run test -w client`: 19 files, 88 tests passed.
- `npm run build:client`: passed type checking, production compilation, and
  static generation for 25 pages.
- `server\.\mvnw.cmd -B test` from the repository root exposed the existing
  Windows wrapper assumption: it searches for `.mvn` from the current working
  directory and could not find `server/.mvn`.
- Running the same checked-in wrapper from its project directory with
  `server\mvnw.cmd -B test`: 22 tests passed, 0 failures, 0 errors, 0 skipped;
  Maven reported `BUILD SUCCESS`.
- `git diff --check`: passed.
- `git status --short`: only intended client source/tests, `design-qa.md`, QA
  screenshots, and this task report were present before commit.

## Concern

P3 only: the running local database's user real-name values are encoded as
question marks. This frontend-only task made no server or database change. A
separate environment cleanup can reload those rows from the checked-in UTF-8
seed if current local display fidelity is required.

## Review follow-up: durable browser evidence

The first evidence draft exposed the correct routes but used an unwrapped
pagination fixture. `apiRequest` requires `{ success: true, data: ... }`, so
the product and order pages entered their retry state. The corrected fixture
uses the production response envelope and waits for named fixture rows rather
than counting Carbon skeleton rows.

The corrected browser matrix also exposed a real console defect:
`OrderItemsEditor` supplied `danger--ghost` to a `hasIconOnly` Carbon button,
whose icon-button contract accepts only primary, secondary, ghost, or tertiary.

### RED

`npm run test -w client -- src/components/orders/OrderItemsEditor.test.tsx`

- Result: 1 failed, 1 passed.
- The delete action rendered `cds--btn--danger--ghost` instead of the supported
  `cds--btn--ghost` class.
- Carbon emitted both invalid-kind prop validation errors.

### GREEN

- Changed the icon-only delete action to `kind="ghost"`.
- Added the scoped `aster-order-items__delete` class to retain destructive
  support-error color.
- Added class-contract assertions to the component test.
- Re-ran the focused test: 2 tests passed.

### Browser evidence

- `docs/superpowers/qa/carbon-precision/browser-qa-log.json` contains the raw
  route, DOM assertion, console, page-error, request-failure, HTTP-error, and
  network status evidence.
- `docs/superpowers/qa/carbon-precision/README.md` records the runtime,
  fixture envelope, safety boundary, evidence contract, and replay outline.
- `docs/superpowers/qa/carbon-precision/products-mobile.jpg` is the rendered
  390x844 product table.
- Final matrix: 11/11 cases passed; 0 console issues, 0 page errors,
  0 request failures, and 0 HTTP errors.
- Mobile product containment: 1120px table, 356px Carbon scrolling container,
  and no page-level horizontal overflow at the 390px viewport.
