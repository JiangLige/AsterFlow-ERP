# Carbon Precision Redesign QA

## Approved design

- Specification: `docs/superpowers/specs/2026-07-22-carbon-precision-redesign-design.md`
- Browser: isolated headless Google Chrome with a fresh browser context, `zh-CN`,
  light color scheme, and reduced motion.
- Authentication: exercised through the visible login form with the local
  `admin` and `staff` test accounts. No session storage or authentication
  internals were inspected.

## Screenshot evidence

| Route | Viewport | Evidence |
| --- | --- | --- |
| `/login` | 1440x900 | `docs/superpowers/qa/carbon-precision/login-desktop.jpg` |
| `/login` | 390x844 | `docs/superpowers/qa/carbon-precision/login-mobile.jpg` |
| `/` | 1440x900 | `docs/superpowers/qa/carbon-precision/dashboard-desktop.jpg` |
| `/` | 1024x768 | `docs/superpowers/qa/carbon-precision/dashboard-tablet.jpg` |
| `/` | 390x844 | `docs/superpowers/qa/carbon-precision/dashboard-mobile.jpg` |
| `/products` | 1440x900 | `docs/superpowers/qa/carbon-precision/products-desktop.jpg` |
| `/products/new` | 1440x900 | `docs/superpowers/qa/carbon-precision/product-form-desktop.jpg` |
| `/products/new` | 390x844 | `docs/superpowers/qa/carbon-precision/product-form-mobile.jpg` |
| `/purchase-orders` | 1440x900 | `docs/superpowers/qa/carbon-precision/purchase-orders-desktop.jpg` |
| `/purchase-orders/new` | 1440x900 | `docs/superpowers/qa/carbon-precision/purchase-order-form-desktop.jpg` |

## Route and interaction results

- `/login`: desktop and mobile layouts remained within the viewport, every
  label was associated with its field, and form submission established a
  valid local test session.
- `/`: 1440px, 1024px, and 390px layouts remained horizontally contained.
  The 48px application header, desktop top modules, contextual navigation,
  responsive metric strip, and primary action matched the approved hierarchy.
- Mobile navigation exposed all four module groups and all nine destinations.
  The panel fitted the 390x844 viewport and provided vertical scrolling if its
  content grows.
- `/products`: query and clear restored the expected result counts, the 20-row
  page-size selection issued the expected pagination request, active and
  inactive Carbon status tags rendered, and the overflow menu was operable
  with Enter and ArrowDown. At 390px the Carbon data-table content owned the
  horizontal scrolling while the page remained contained.
- `/products/new`: nine labels resolved to their inputs. The form used two
  columns on desktop and one column at 390px. A held browser response showed
  the disabled `提交中...` state before the browser fixture completed.
- `/purchase-orders`: status and keyword filters returned the expected draft,
  approved, and canceled states. Approve and cancel dialogs had accessible
  names and exact impact copy; each was canceled without a destructive
  mutation. Admin-only delete remained hidden from the staff role.
- `/purchase-orders/new`: adding a row, changing product, quantity, and price,
  recalculating the line amount, and removing the second row all worked.
  Submitting an invalid remaining row produced the inline validation alert and
  sent no create request.
- Keyboard traversal covered the skip link, top modules, contextual
  navigation, table overflow actions, form fields, and action buttons. The
  skip link moved focus to `main#main-content`; the disabled sole-row delete
  control was correctly skipped.

## Console, network, and accessibility

- The final route checks produced zero browser console errors, zero browser
  console warnings, zero page errors, zero request failures, and zero HTTP
  responses at or above 400.
- Page landmarks, heading order, dialog names, field labels, focus order,
  keyboard table actions, and responsive containment were inspected in the
  rendered accessibility and layout state.
- The static preflight found no retired warm tokens, forbidden business-use
  Tabler icons, inline style objects, or en/em dashes in migrated page,
  component, and stylesheet sources.

## Controlled browser fixtures

Browser-only route interception was used where the current local database could
not supply the exact QA state. It changed neither source files nor backend data:

- Product list GET responses supplied five realistic records: the four current
  seeded products plus one inactive, out-of-stock keyboard record.
- Product create POST was held and then fulfilled by the browser only, allowing
  the loading state to be inspected without creating a database record.
- Purchase-order list GET responses supplied one draft, one approved, and one
  canceled order because the current local database returned an empty list.
- No approve, cancel, delete, or create mutation was confirmed against the
  backend during QA.

## Deviations and resolutions

| Severity | Finding | Resolution |
| --- | --- | --- |
| P1 | The 390px menu exposed only the active context and made the other modules unreachable. | Fixed the mobile panel to expose all module groups and routes; added an accessibility regression test and browser-retested at 390x844. |
| P1 | Confirmation dialogs displayed a heading but the dialog landmark had no accessible name. | Connected the title through the modal `aria-label`; added a regression assertion and browser-retested approve and cancel dialogs. |
| P1 | The skip link updated the fragment but did not move keyboard focus to the main region. | Made the main region programmatically focusable; added a shell contract test and browser-retested focus transfer. |
| P1 | The purchase-order operations toolbar expanded into a large empty desktop panel. | Added a compact three-column Carbon toolbar grid with a one-column mobile rule; added a CSS contract test and browser-retested the list. |
| P3 | The running local database returned question marks for user real names although the checked-in seed source contains Chinese names. | Recorded as external test-data state. Server and database changes are outside this frontend-only task; the shell remains functional and no P0, P1, or P2 redesign defect remains. |

## Dependency decision

`@tabler/icons-react` remains intentionally installed only for
`BrandMark.tsx` and its approved `IconRosette` brand exception. All business
icons use Carbon icons, so no package or lockfile change was warranted.

final result: passed
