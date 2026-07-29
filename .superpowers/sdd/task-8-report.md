# Carbon Precision Task 8 Report

## Outcome

Migrated the seven product, supplier, customer, and stock forms to the existing IBM Carbon component system. The pages now use `PageHeader`, `FormActions`, and `DataState` where applicable, preserve their existing API contracts and routes, expose associated labels, and provide explicit loading, error, success, and submitting states.

## TDD Evidence

### RED

Command:

```powershell
npm run test -w client -- src/tests/pages/product-form.test.tsx
```

Result: failed as expected. Testing Library found the `商品编码` label but no associated form control. The legacy page also exposed only the old `保存` label instead of the required `保存商品` action.

### GREEN

Command:

```powershell
npm run test -w client -- src/tests/pages/product-form.test.tsx src/tests/pages/master-data-forms.test.tsx
```

Result: 2 test files passed, 9 tests passed.

Covered contracts:

- Product create field order, accessible visible labels, exact POST payload, and `/products` navigation.
- Product edit GET hydration and exact PUT payload.
- Stock IN, OUT, and ADJUST `getChangeQuantity` semantics and exact PATCH payload.
- Supplier and customer create POST payloads.
- Supplier and customer edit GET hydration and PUT payloads.

## Contract Audit

- Product fields remain in this order: `productCode`, `name`, `category`, `unit`, `price`, `cost`, `stock`, `status`, `description`.
- Supplier fields remain in this order: `supplierCode`, `name`, `contactName`, `phone`, `address`, `status`.
- Customer fields remain in this order: `customerCode`, `name`, `contactName`, `phone`, `address`, `status`.
- Product create uses `POST /api/products`; product edit uses `GET/PUT /api/products/:id`.
- Stock uses `GET /api/products/:id` and `PATCH /api/products/:id/stock`.
- Supplier create/edit use the existing POST, GET, and PUT paths.
- Customer create/edit use the existing POST, GET, and PUT paths.
- Successful master-data saves still navigate to their matching list routes.
- All cancellation actions are Next links to the matching list route.

## UI and Accessibility Audit

- Uses the existing official `@carbon/react` Form, TextInput, NumberInput, Select, TextArea, RadioButtonGroup, Button, and InlineNotification components.
- Labels are above controls and programmatically associated through Carbon IDs.
- Product descriptions and supplier/customer addresses span both columns.
- `.aster-form-grid` uses two columns on desktop and one column below 768px.
- The sticky action row remains in form flow, so the final field can scroll above it.
- Submitting disables the primary action and prevents repeated requests.
- Loading uses `DataState`; request errors use Carbon inline notifications; stock success uses a success inline notification.
- Existing light palette tokens remain `#f4f4f4`, `#ffffff`, `#161616`, `#525252`, `#c6c6c6`, and `#0f62fe`.
- Added form styles use 0px radii, no shadows, no gradients, no warm colors, no inline styles, and no `100vh`.
- Carbon focus treatment and text/control contrast remain on the project AA-oriented token palette.

## Final Verification

```text
npm run test -w client
16 test files passed
67 tests passed

npm run build:client
Compiled successfully
25 static pages generated
All seven form routes present in the build output

git diff --check
Passed
```

## Concerns

None.
