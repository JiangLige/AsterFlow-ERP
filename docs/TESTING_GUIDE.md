# Demo ERP Testing Guide

This document explains the testing files added while hardening the ERP project from a runnable demo into a more interview-ready engineering project.

## Why Add Integration Tests

The ERP business core is not just CRUD. A sale order approval changes three things in one transaction:

- the sale order status
- the product stock
- the stock record audit trail

If any part fails, all previous changes in the same business operation must roll back. This is why the project needs Spring integration tests, not only manual page testing.

## Files Added

### `server/src/test/resources/schema.sql`

Spring Boot automatically runs this file for the H2 test database.

It creates the smallest set of tables needed by the sale order tests:

- `t_customer`
- `t_supplier`
- `t_product`
- `t_order_sequence`
- `t_purchase_order`
- `t_purchase_order_item`
- `t_sale_order`
- `t_sale_order_item`
- `t_stock_record`

The production database still uses `server/src/main/resources/db/init.sql`. The test schema exists so automated tests can run without requiring a local MySQL instance.

### `server/src/test/java/com/demo/erp/service/SaleOrderServiceIntegrationTest.java`

This test class starts the real Spring application context and uses real MyBatis mappers against the H2 database.

It verifies three business scenarios:

- approving a sale order deducts stock and creates an outbound stock record
- canceling an approved sale order restores stock and creates an inbound stock record
- approving an order rolls back when a later item has insufficient stock

### `server/src/test/java/com/demo/erp/service/PurchaseOrderServiceIntegrationTest.java`

This test class uses the same integration-test style for the purchase order flow.

It verifies three business scenarios:

- approving a purchase order increases stock and creates an inbound stock record
- canceling an approved purchase order deducts stock and creates an outbound stock record
- canceling a purchase order rolls back when current stock cannot cover the reversal

## Important Testing Detail

The test class intentionally does not use class-level `@Transactional`.

Reason: we want `SaleOrderService.approve()` and `SaleOrderService.cancel()` to control their own transaction boundaries. If the test method itself opens an outer transaction, assertions can observe uncommitted state before rollback happens, which can hide or distort the real production behavior.

Instead, the test uses `@BeforeEach` to delete rows from the test tables. This keeps each test isolated while preserving realistic service transaction behavior.

## How To Run

From the project root on Windows:

```powershell
$env:JAVA_HOME='C:\Users\EDY\.jdks\corretto-21.0.11'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
cd server
.\mvnw.cmd -Dtest=SaleOrderServiceIntegrationTest test
```

Run the purchase order integration tests:

```powershell
$env:JAVA_HOME='C:\Users\EDY\.jdks\corretto-21.0.11'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
cd server
.\mvnw.cmd -Dtest=PurchaseOrderServiceIntegrationTest test
```

Run all backend tests and package the server:

```powershell
$env:JAVA_HOME='C:\Users\EDY\.jdks\corretto-21.0.11'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
npm run build:server
```

## Interview Talking Points

You can explain this part like this:

> I wrote service-level integration tests for the sale order flow. Approval deducts stock and writes an outbound stock record in the same transaction. Canceling an approved order generates a reverse inbound record. I also tested rollback: if one item has insufficient stock, the whole approval fails, the order remains draft, previous stock deduction is rolled back, and no stock records remain.

This shows that the project handles transaction consistency, not only page-level CRUD.

For purchase orders:

> I also wrote integration tests for the purchase order flow. Approval increases product stock and records inbound inventory. Canceling an approved purchase order creates a reverse outbound record. If current stock is no longer enough to reverse the purchase, the cancel operation fails, the order remains approved, and no partial reverse stock records are written.

## Next Testing Step

After sale and purchase order service flows, the next useful testing step is controller-level API testing:

- protected endpoints reject requests without JWT
- admin-only delete endpoints reject staff users
- invalid request bodies return `VALIDATION_ERROR`
- list endpoints enforce pagination and status validation
