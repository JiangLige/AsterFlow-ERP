# Autonomous Replenishment Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a DeepSeek-assisted, rule-safe ERP Agent that can autonomously plan, order, simulate delivery, and receive replenishment purchases with deterministic calculations, task-level amount protection, fallback execution, and full auditability.

**Architecture:** DeepSeek and Spring AI interpret goals and call a narrow tool facade; a persisted Java workflow owns calculations, state transitions, idempotency, permissions, and all writes through existing ERP services. Manual and scheduled triggers share the same workflow, while the frontend presents a chat-first console with resumable SSE progress.

**Tech Stack:** Java 21, Spring Boot 4.0.5, Spring AI 2.0.0, MyBatis-Plus 3.5.15, MySQL 8, H2 tests, Next.js 14.2, React 18.3, TypeScript 5.4, Vitest, Testing Library.

## Global Constraints

- Follow the approved design at `docs/superpowers/specs/2026-07-20-autonomous-replenishment-agent-design.md`.
- DeepSeek is configured through `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, and `DEEPSEEK_MODEL`; no secret may enter source, SQL, logs, fixtures, screenshots, or commits.
- Default model is `deepseek-v4-flash`; `deepseek-v4-pro` is an environment override.
- The LLM may request registered tools but may not compute final quantities, bypass Java validation, access Mapper classes, or write SQL.
- Only the deterministic workflow may create orders or receive stock; `InventoryService` remains the stock-write boundary.
- Manual autonomous tasks require `ADMIN`; scheduled tasks use the non-login `SYSTEM_AGENT` identity.
- The only configurable business guardrail is the whole-task purchase amount limit. Splitting supplier orders must not bypass it.
- Purchase states are `DRAFT`, `ORDERED`, `IN_TRANSIT`, `RECEIVED`, and `CANCELED`; stock changes only on `RECEIVED`.
- Tests must use a fake model client and must not call DeepSeek.
- Preserve Chinese UI copy, Java comments, SQL comments, and UTF-8 encoding.
- The current directory has no `.git`. Execute commit steps only after moving the work into the intended Git checkout; do not run `git init` implicitly.
- At execution time, if a Git checkout is available, use `using-git-worktrees` before implementation and validate the baseline with `npm run build:client` and `server\.\mvnw.cmd test`.

## File Structure

### Backend domain and persistence

- `server/src/main/java/entity/SupplierProductQuote.java` — supplier/product commercial terms.
- `server/src/main/java/entity/AgentPolicy.java` — versioned automation policy.
- `server/src/main/java/entity/AgentTask.java` — persisted task identity, trigger, execution state, limits, and model metadata.
- `server/src/main/java/entity/AgentTaskStep.java` — sanitized execution timeline.
- `server/src/main/java/entity/ReplenishmentPlanItem.java` — reproducible per-product calculation snapshot.
- `server/src/main/java/com/demo/erp/mapper/*Mapper.java` — MyBatis-Plus persistence and aggregate queries.
- `server/src/main/java/com/demo/erp/enums/Agent*.java` — task, trigger, step, and plan-item states.

### Backend agent modules

- `server/src/main/java/com/demo/erp/ai/domain/*` — immutable calculation, goal, execution-context, and tool-result records.
- `server/src/main/java/com/demo/erp/ai/service/SupplierProductQuoteService.java` — quote catalog use cases.
- `server/src/main/java/com/demo/erp/ai/service/AgentTaskService.java` — task lifecycle and timeline persistence.
- `server/src/main/java/com/demo/erp/ai/service/ReplenishmentCalculator.java` — pure quantity and supplier scoring logic.
- `server/src/main/java/com/demo/erp/ai/service/ReplenishmentDataService.java` — inventory, net demand, in-transit, and quote snapshots.
- `server/src/main/java/com/demo/erp/ai/service/ReplenishmentWorkflowService.java` — deterministic orchestration and recovery.
- `server/src/main/java/com/demo/erp/ai/service/AgentConversationService.java` — model-first submission with deterministic fallback.
- `server/src/main/java/com/demo/erp/ai/tools/ErpAgentTools.java` — the exact tool surface visible to DeepSeek.
- `server/src/main/java/com/demo/erp/ai/scheduler/*` — daily trigger and delivery simulation.
- `server/src/main/java/com/demo/erp/ai/web/*` — task, policy, quote, and SSE endpoints.

### Existing purchase flow

- `server/src/main/java/entity/PurchaseOrder.java` — agent linkage and lifecycle timestamps.
- `server/src/main/java/com/demo/erp/enums/PurchaseOrderStatus.java` — real procurement states.
- `server/src/main/java/com/demo/erp/service/PurchaseOrderService.java` — order, ship, receive, and agent-create contracts.
- `server/src/main/java/com/demo/erp/service/impl/PurchaseOrderServiceImpl.java` — transactional lifecycle implementation.
- `server/src/main/java/com/demo/erp/controller/PurchaseOrderController.java` — lifecycle HTTP endpoints and audit records.

### Frontend

- `client/src/pages/agent.tsx` — chat-first Agent console.
- `client/src/pages/supplier-quotes.tsx` — quote maintenance.
- `client/src/components/agent/*` — conversation, task sidebar, timeline, amount-pause, and policy components.
- `client/src/lib/agent-api.ts` — typed task and policy requests.
- `client/src/lib/agent-stream.ts` — authenticated fetch-based SSE parser.
- `client/src/pages/api/agent/**` — authenticated Next.js proxies, including streamed events.
- `client/src/pages/api/supplier-product-quotes/**` — quote proxies.

---

### Task 1: Supplier quote catalog vertical slice

**Files:**
- Create: `server/src/main/java/entity/SupplierProductQuote.java`
- Create: `server/src/main/java/com/demo/erp/mapper/SupplierProductQuoteMapper.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/SupplierQuoteCommand.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/SupplierQuoteResponse.java`
- Create: `server/src/main/java/com/demo/erp/ai/service/SupplierProductQuoteService.java`
- Create: `server/src/main/java/com/demo/erp/ai/service/impl/SupplierProductQuoteServiceImpl.java`
- Create: `server/src/main/java/com/demo/erp/ai/web/SupplierProductQuoteController.java`
- Create: `server/src/main/resources/db/upgrade/2026-07-20-01-supplier-product-quote.sql`
- Modify: `server/src/main/resources/db/init.sql`
- Modify: `server/src/test/resources/schema.sql`
- Create: `server/src/test/java/com/demo/erp/ai/SupplierProductQuoteServiceIntegrationTest.java`

**Interfaces:**
- Consumes: existing `SupplierMapper`, `ProductMapper`, `PageResponse`, `BusinessException`, and `AuthUtil.requireAdmin(HttpServletRequest)`.
- Produces: `SupplierProductQuoteService.upsert(SupplierQuoteCommand)`, `get(Long)`, `page(Long, Long, String, long, long)`, `changeStatus(Long, String)`, and `findActiveByProductIds(Collection<Long>)`.

- [ ] **Step 1: Write the failing quote-service integration test**

```java
@SpringBootTest
class SupplierProductQuoteServiceIntegrationTest {
    @Autowired SupplierProductQuoteService service;

    @Test
    void upsertReturnsOneActiveQuotePerSupplierAndProduct() {
        SupplierQuoteCommand command = new SupplierQuoteCommand(
                null, 1L, 1L, new BigDecimal("175.00"),
                3, 20, new BigDecimal("92.00"), true, "ACTIVE");

        SupplierQuoteResponse created = service.upsert(command);
        SupplierQuoteResponse updated = service.upsert(new SupplierQuoteCommand(
                created.id(), 1L, 1L, new BigDecimal("170.00"),
                2, 20, new BigDecimal("94.00"), true, "ACTIVE"));

        assertThat(updated.id()).isEqualTo(created.id());
        assertThat(updated.purchasePrice()).isEqualByComparingTo("170.00");
        assertThat(service.findActiveByProductIds(List.of(1L))).hasSize(1);
    }
}
```

- [ ] **Step 2: Run the test and verify the missing-service failure**

Run: `server\.\mvnw.cmd -Dtest=SupplierProductQuoteServiceIntegrationTest test`

Expected: compilation fails because `SupplierProductQuoteService` and its DTOs do not exist.

- [ ] **Step 3: Add the table, entity, mapper, DTOs, and service contract**

Use this SQL in both fresh and upgrade schemas; the H2 copy omits MySQL comments but preserves constraints:

```sql
CREATE TABLE t_supplier_product_quote (
    id BIGINT NOT NULL AUTO_INCREMENT,
    supplier_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    purchase_price DECIMAL(12,2) NOT NULL,
    lead_time_days INT NOT NULL,
    min_order_quantity INT NOT NULL,
    quality_score DECIMAL(5,2) NOT NULL,
    preferred TINYINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_supplier_product_quote (supplier_id, product_id),
    KEY idx_supplier_quote_product_status (product_id, status),
    CHECK (purchase_price > 0),
    CHECK (lead_time_days >= 0),
    CHECK (min_order_quantity > 0),
    CHECK (quality_score >= 0 AND quality_score <= 100)
);
```

Define the immutable boundary types exactly as follows:

```java
public record SupplierQuoteCommand(
        Long id,
        Long supplierId,
        Long productId,
        BigDecimal purchasePrice,
        Integer leadTimeDays,
        Integer minOrderQuantity,
        BigDecimal qualityScore,
        Boolean preferred,
        String status) {
}

public record SupplierQuoteResponse(
        Long id,
        Long supplierId,
        String supplierName,
        Long productId,
        String productCode,
        String productName,
        BigDecimal purchasePrice,
        Integer leadTimeDays,
        Integer minOrderQuantity,
        BigDecimal qualityScore,
        Boolean preferred,
        String status) {
}
```

The entity must map every SQL column, use `@TableName("t_supplier_product_quote")`, `@TableId(type = IdType.AUTO)`, `@Version`, and standard getters/setters. The mapper extends `BaseMapper<SupplierProductQuote>`.

- [ ] **Step 4: Implement validation, upsert, lookup, pagination, and admin endpoints**

Implement validation before persistence:

```java
private void validate(SupplierQuoteCommand command) {
    if (command.purchasePrice() == null || command.purchasePrice().signum() <= 0) {
        throw new BusinessException("采购价必须大于0");
    }
    if (command.leadTimeDays() == null || command.leadTimeDays() < 0) {
        throw new BusinessException("交付周期不能小于0");
    }
    if (command.minOrderQuantity() == null || command.minOrderQuantity() <= 0) {
        throw new BusinessException("最小起订量必须大于0");
    }
    if (command.qualityScore() == null
            || command.qualityScore().compareTo(BigDecimal.ZERO) < 0
            || command.qualityScore().compareTo(new BigDecimal("100")) > 0) {
        throw new BusinessException("质量评分必须在0到100之间");
    }
}
```

`SupplierProductQuoteController` uses `/api/supplier-product-quotes`; every POST, PUT, PATCH operation calls `AuthUtil.requireAdmin(request)`. GET operations also remain admin-only for the first release.

- [ ] **Step 5: Run the focused and full backend tests**

Run: `server\.\mvnw.cmd -Dtest=SupplierProductQuoteServiceIntegrationTest test`

Expected: `Tests run: 1, Failures: 0, Errors: 0`.

Run: `server\.\mvnw.cmd test`

Expected: all existing backend tests pass.

- [ ] **Step 6: Commit the quote catalog slice**

```bash
git add server/src/main/java/entity/SupplierProductQuote.java server/src/main/java/com/demo/erp/mapper/SupplierProductQuoteMapper.java server/src/main/java/com/demo/erp/ai server/src/main/resources/db server/src/test
git commit -m "feat: add supplier product quote catalog"
```

### Task 2: Persist Agent policy, tasks, steps, and plan snapshots

**Files:**
- Create: `server/src/main/java/entity/AgentPolicy.java`
- Create: `server/src/main/java/entity/AgentTask.java`
- Create: `server/src/main/java/entity/AgentTaskStep.java`
- Create: `server/src/main/java/entity/ReplenishmentPlanItem.java`
- Create: `server/src/main/java/com/demo/erp/enums/AgentTaskStatus.java`
- Create: `server/src/main/java/com/demo/erp/enums/AgentTriggerType.java`
- Create: `server/src/main/java/com/demo/erp/enums/AgentStepStatus.java`
- Create: `server/src/main/java/com/demo/erp/enums/ReplenishmentPlanItemStatus.java`
- Create: `server/src/main/java/com/demo/erp/mapper/AgentPolicyMapper.java`
- Create: `server/src/main/java/com/demo/erp/mapper/AgentTaskMapper.java`
- Create: `server/src/main/java/com/demo/erp/mapper/AgentTaskStepMapper.java`
- Create: `server/src/main/java/com/demo/erp/mapper/ReplenishmentPlanItemMapper.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/CreateAgentTaskCommand.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/AgentExecutionContext.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/AgentTaskDetail.java`
- Create: `server/src/main/java/com/demo/erp/ai/service/AgentTaskService.java`
- Create: `server/src/main/java/com/demo/erp/ai/service/impl/AgentTaskServiceImpl.java`
- Create: `server/src/main/resources/db/upgrade/2026-07-20-02-agent-task-tables.sql`
- Modify: `server/src/main/resources/db/init.sql`
- Modify: `server/src/test/resources/schema.sql`
- Create: `server/src/test/java/com/demo/erp/ai/AgentTaskPersistenceIntegrationTest.java`

**Interfaces:**
- Consumes: `OrderNoGenerator.generate("AT")` and MyBatis-Plus mappers.
- Produces: `AgentTaskService.createOrGet`, `transition`, `appendStep`, `savePlanItems`, `findByTaskNo`, `findByIdempotencyKey`, and `findRecoverableTasks`.

- [ ] **Step 1: Write the failing persistence and idempotency test**

```java
@SpringBootTest
class AgentTaskPersistenceIntegrationTest {
    @Autowired AgentTaskService service;

    @Test
    void repeatedIdempotencyKeyReturnsTheSameTask() {
        AgentExecutionContext admin = new AgentExecutionContext(1L, "admin", "ADMIN");
        CreateAgentTaskCommand command = new CreateAgentTaskCommand(
                "检查库存并完成今日补货", "MANUAL", "manual-20260720-001",
                new BigDecimal("20000.00"), admin);

        AgentTaskDetail first = service.createOrGet(command);
        AgentTaskDetail second = service.createOrGet(command);

        assertThat(second.taskNo()).isEqualTo(first.taskNo());
        assertThat(second.status()).isEqualTo("PENDING");
    }
}
```

- [ ] **Step 2: Run the test and verify it fails before persistence exists**

Run: `server\.\mvnw.cmd -Dtest=AgentTaskPersistenceIntegrationTest test`

Expected: compilation fails on missing `AgentTaskService`.

- [ ] **Step 3: Add exact enums, records, tables, entities, and mappers**

```java
public enum AgentTaskStatus {
    PENDING, RUNNING, PAUSED_LIMIT, WAITING_DELIVERY,
    SUCCEEDED, COMPLETED_WITH_WARNINGS, FAILED, CANCELED
}

public enum AgentTriggerType { MANUAL, SCHEDULED }
public enum AgentStepStatus { RUNNING, SUCCEEDED, FAILED, SKIPPED }
public enum ReplenishmentPlanItemStatus { PLANNED, ORDERED, RECEIVED, SKIPPED }

public record AgentExecutionContext(Long userId, String username, String role) {
    public boolean isAdminOrSystem() {
        return "ADMIN".equals(role) || "SYSTEM_AGENT".equals(role);
    }
}
```

Create four tables matching the design. Required uniqueness is `uk_agent_task_idempotency(idempotency_key)` and required indexes are task status, task creation time, step task/sequence, and plan-item task/product. `t_agent_policy` contains a single row with ID `1`, version `1`, enabled `false`, Cron `0 30 8 * * *`, amount limit `20000.00`, lookback `30`, safety days `7`, and delivery simulation `false`.

- [ ] **Step 4: Implement idempotent creation and legal transitions**

The service contract is exact:

```java
public interface AgentTaskService {
    AgentTaskDetail createOrGet(CreateAgentTaskCommand command);
    AgentTaskDetail transition(String taskNo, AgentTaskStatus expected, AgentTaskStatus next);
    void appendStep(String taskNo, String stage, String toolName,
                    String inputSummary, String outputSummary, AgentStepStatus status);
    void savePlanItems(Long taskId, List<ReplenishmentPlanItem> items);
    AgentTaskDetail findByTaskNo(String taskNo);
    AgentTaskDetail findByIdempotencyKey(String idempotencyKey);
    List<AgentTaskDetail> findRecoverableTasks();
}
```

`createOrGet` queries the unique key first, creates `ATyyyyMMddNNNN` through `OrderNoGenerator` when absent, and catches `DuplicateKeyException` to re-query the winning row under concurrent requests. `transition` uses a conditional update on both task number and expected status; zero updated rows produce `BusinessException("Agent任务状态已变化")`.

- [ ] **Step 5: Run focused and full tests**

Run: `server\.\mvnw.cmd -Dtest=AgentTaskPersistenceIntegrationTest test`

Expected: the repeated idempotency key returns one task.

Run: `server\.\mvnw.cmd test`

Expected: all backend tests pass.

- [ ] **Step 6: Commit Agent persistence**

```bash
git add server/src/main/java/entity server/src/main/java/com/demo/erp/ai server/src/main/java/com/demo/erp/enums server/src/main/java/com/demo/erp/mapper server/src/main/resources/db server/src/test
git commit -m "feat: persist agent tasks and policies"
```

### Task 3: Implement the pure replenishment calculator

**Files:**
- Create: `server/src/main/java/com/demo/erp/ai/domain/ReplenishmentCandidate.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/SupplierQuoteCandidate.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/ReplenishmentDecision.java`
- Create: `server/src/main/java/com/demo/erp/ai/service/ReplenishmentCalculator.java`
- Create: `server/src/test/java/com/demo/erp/ai/ReplenishmentCalculatorTest.java`

**Interfaces:**
- Consumes: no Spring or persistence dependencies.
- Produces: `ReplenishmentCalculator.calculate(ReplenishmentCandidate, List<SupplierQuoteCandidate>)`.

- [ ] **Step 1: Write failing tests for quantity, MOQ, in-transit subtraction, and stable supplier scoring**

```java
class ReplenishmentCalculatorTest {
    private final ReplenishmentCalculator calculator = new ReplenishmentCalculator();

    @Test
    void calculatesReproducibleQuantityAndBestSupplier() {
        ReplenishmentCandidate candidate = new ReplenishmentCandidate(
                1L, "P-1001", "无线扫码枪", 10, 5, 0, 30, 30, 7);
        List<SupplierQuoteCandidate> quotes = List.of(
                new SupplierQuoteCandidate(1L, "华东供应商", new BigDecimal("180"), 3, 20, new BigDecimal("100"), true),
                new SupplierQuoteCandidate(2L, "北方供应商", new BigDecimal("170"), 8, 10, BigDecimal.ZERO, false));

        ReplenishmentDecision result = calculator.calculate(candidate, quotes);

        assertThat(result.targetStock()).isEqualTo(10);
        assertThat(result.recommendedQuantity()).isEqualTo(20);
        assertThat(result.supplierId()).isEqualTo(1L);
    }

    @Test
    void returnsZeroWhenCurrentAndInTransitCoverTarget() {
        ReplenishmentCandidate candidate = new ReplenishmentCandidate(
                1L, "P-1001", "无线扫码枪", 10, 12, 30, 30, 30, 7);
        assertThat(calculator.calculate(candidate, List.of()).recommendedQuantity()).isZero();
    }
}
```

- [ ] **Step 2: Run the unit test and verify the class is missing**

Run: `server\.\mvnw.cmd -Dtest=ReplenishmentCalculatorTest test`

Expected: compilation fails on missing calculator/domain records.

- [ ] **Step 3: Implement the records and deterministic formula**

```java
public record ReplenishmentCandidate(
        Long productId,
        String productCode,
        String productName,
        int minStock,
        int currentStock,
        int inTransitQuantity,
        int netSaleQuantity,
        int lookbackDays,
        int safetyDays) {
}

public record SupplierQuoteCandidate(
        Long supplierId,
        String supplierName,
        BigDecimal purchasePrice,
        int leadTimeDays,
        int minOrderQuantity,
        BigDecimal qualityScore,
        boolean preferred) {
}
```

```java
public ReplenishmentDecision calculate(
        ReplenishmentCandidate candidate,
        List<SupplierQuoteCandidate> quotes) {
    BigDecimal dailyAverage = BigDecimal.valueOf(candidate.netSaleQuantity())
            .divide(BigDecimal.valueOf(candidate.lookbackDays()), 6, RoundingMode.HALF_UP);
    int demandTarget = dailyAverage
            .multiply(BigDecimal.valueOf(candidate.safetyDays()))
            .setScale(0, RoundingMode.CEILING)
            .intValue();
    int targetWithoutLead = Math.max(candidate.minStock(), demandTarget);

    if (quotes.isEmpty()) {
        int shortage = Math.max(0, targetWithoutLead - candidate.currentStock() - candidate.inTransitQuantity());
        return ReplenishmentDecision.withoutSupplier(candidate, targetWithoutLead, shortage);
    }

    List<ScoredQuote> scored = scoreQuotes(quotes);
    ScoredQuote best = scored.stream()
            .max(Comparator.comparing(ScoredQuote::score)
                    .thenComparing(q -> q.quote().preferred())
                    .thenComparing(q -> -q.quote().supplierId()))
            .orElseThrow();
    int target = Math.max(candidate.minStock(), dailyAverage
            .multiply(BigDecimal.valueOf(best.quote().leadTimeDays() + candidate.safetyDays()))
            .setScale(0, RoundingMode.CEILING)
            .intValue());
    int shortage = Math.max(0, target - candidate.currentStock() - candidate.inTransitQuantity());
    int quantity = shortage == 0 ? 0 : Math.max(shortage, best.quote().minOrderQuantity());
    return ReplenishmentDecision.selected(candidate, best.quote(), target, shortage, quantity, best.score());
}
```

`scoreQuotes` normalizes lower price and lead time as higher scores and keeps `qualityScore / 100`; final score is price `0.50`, lead time `0.25`, quality `0.25`. When every candidate has the same value for one dimension, assign `1.0` for that dimension to all candidates.

- [ ] **Step 4: Run focused and full tests**

Run: `server\.\mvnw.cmd -Dtest=ReplenishmentCalculatorTest test`

Expected: all calculator tests pass without starting Spring.

Run: `server\.\mvnw.cmd test`

Expected: all backend tests pass.

- [ ] **Step 5: Commit the calculator**

```bash
git add server/src/main/java/com/demo/erp/ai/domain server/src/main/java/com/demo/erp/ai/service/ReplenishmentCalculator.java server/src/test/java/com/demo/erp/ai/ReplenishmentCalculatorTest.java
git commit -m "feat: add deterministic replenishment calculator"
```

### Task 4: Build the ERP data snapshot and plan persistence service

**Files:**
- Modify: `server/src/main/java/com/demo/erp/mapper/StockRecordMapper.java`
- Modify: `server/src/main/java/com/demo/erp/mapper/PurchaseOrderItemMapper.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/ProductDemandAggregate.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/InTransitAggregate.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/ReplenishmentPolicySnapshot.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/ReplenishmentPlan.java`
- Create: `server/src/main/java/com/demo/erp/ai/service/ReplenishmentDataService.java`
- Create: `server/src/main/java/com/demo/erp/ai/service/impl/ReplenishmentDataServiceImpl.java`
- Create: `server/src/test/java/com/demo/erp/ai/ReplenishmentDataServiceIntegrationTest.java`

**Interfaces:**
- Consumes: `ReplenishmentCalculator`, product/stock/order/quote mappers, and `AgentTaskService.savePlanItems`.
- Produces: `ReplenishmentDataService.createPlan(long taskId, ReplenishmentPolicySnapshot policy)`.

- [ ] **Step 1: Write a failing integration test using stock movements and in-transit orders**

```java
@SpringBootTest
class ReplenishmentDataServiceIntegrationTest {
    @Autowired ReplenishmentDataService service;

    @Test
    void netSalesAndInTransitBecomeAStoredPlanSnapshot() {
        ReplenishmentPolicySnapshot policy = new ReplenishmentPolicySnapshot(
                1L, 1, 30, 7, new BigDecimal("20000"), false);

        ReplenishmentPlan plan = service.createPlan(100L, policy);

        assertThat(plan.items()).allSatisfy(item -> {
            assertThat(item.lookbackDays()).isEqualTo(30);
            assertThat(item.safetyDays()).isEqualTo(7);
            assertThat(item.recommendedQuantity()).isGreaterThanOrEqualTo(0);
        });
    }
}
```

- [ ] **Step 2: Run the test and verify aggregate queries are absent**

Run: `server\.\mvnw.cmd -Dtest=ReplenishmentDataServiceIntegrationTest test`

Expected: compilation fails on missing data service and aggregate records.

- [ ] **Step 3: Add aggregate mapper queries with exact semantics**

Add a stock query that returns sale outbound minus sale-cancel inbound since the provided timestamp:

```java
@Select("""
    SELECT product_id AS productId,
           SUM(CASE
                 WHEN source_type = 'SALE_ORDER' AND type = 'OUT' THEN change_quantity
                 WHEN source_type = 'SALE_ORDER_CANCEL' AND type = 'IN' THEN -change_quantity
                 ELSE 0
               END) AS netQuantity
      FROM t_stock_record
     WHERE created_at >= #{from}
     GROUP BY product_id
    """)
List<ProductDemandAggregate> sumNetSaleDemand(@Param("from") LocalDateTime from);
```

Add an in-transit query joining purchase items to orders where status is `ORDERED` or `IN_TRANSIT`, grouped by product. Do not count `DRAFT`, `RECEIVED`, or `CANCELED`.

- [ ] **Step 4: Implement `createPlan` and persist every calculation input**

```java
public interface ReplenishmentDataService {
    ReplenishmentPlan createPlan(long taskId, ReplenishmentPolicySnapshot policy);
}
```

The implementation loads all active products, maps aggregate quantities by product ID, loads active quotes in one query, calls the pure calculator once per product, drops zero-quantity decisions, marks missing-quote decisions as `SKIPPED`, and saves fields required by `t_replenishment_plan_item`. It returns `plannedAmount` as the sum of `recommendedQuantity * purchasePrice` for executable items.

- [ ] **Step 5: Run focused and full tests**

Run: `server\.\mvnw.cmd -Dtest=ReplenishmentDataServiceIntegrationTest test`

Expected: plan snapshots contain the policy version and deterministic inputs.

Run: `server\.\mvnw.cmd test`

Expected: all backend tests pass.

- [ ] **Step 6: Commit data snapshot planning**

```bash
git add server/src/main/java/com/demo/erp/mapper server/src/main/java/com/demo/erp/ai server/src/test/java/com/demo/erp/ai
git commit -m "feat: build reproducible replenishment plans"
```

### Task 5: Replace immediate purchase approval with a real lifecycle

**Files:**
- Modify: `server/src/main/java/entity/PurchaseOrder.java`
- Modify: `server/src/main/java/com/demo/erp/enums/PurchaseOrderStatus.java`
- Modify: `server/src/main/java/com/demo/erp/dto/purchase/PurchaseOrderResponse.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/AgentPurchaseOrderCommand.java`
- Modify: `server/src/main/java/com/demo/erp/service/PurchaseOrderService.java`
- Modify: `server/src/main/java/com/demo/erp/service/impl/PurchaseOrderServiceImpl.java`
- Modify: `server/src/main/java/com/demo/erp/controller/PurchaseOrderController.java`
- Create: `server/src/main/resources/db/upgrade/2026-07-20-03-purchase-lifecycle.sql`
- Modify: `server/src/main/resources/db/init.sql`
- Modify: `server/src/test/resources/schema.sql`
- Modify: `server/src/test/java/com/demo/erp/service/PurchaseOrderServiceIntegrationTest.java`
- Modify: `client/src/pages/purchase-orders.tsx`
- Modify: `client/src/pages/purchase-orders/[id].tsx`
- Delete: `client/src/pages/api/purchase-orders/[id]/approve.ts`
- Create: `client/src/pages/api/purchase-orders/[id]/order.ts`
- Create: `client/src/pages/api/purchase-orders/[id]/ship.ts`
- Create: `client/src/pages/api/purchase-orders/[id]/receive.ts`

**Interfaces:**
- Consumes: existing `InventoryService.inbound`, `PurchaseOrderCreateRequest`, and audit service.
- Produces: `order(Long)`, `markInTransit(Long)`, `receive(Long)`, `cancel(Long)`, and `createForAgent(AgentPurchaseOrderCommand)`.

- [ ] **Step 1: Replace old approval assertions with lifecycle-first failing tests**

```java
@Test
void orderAndShipDoNotChangeStockButReceiveDoes() {
    PurchaseOrderResponse order = createPurchaseOrder();
    int before = productMapper.selectById(productId).getStock();

    purchaseOrderService.order(order.getId());
    assertThat(productMapper.selectById(productId).getStock()).isEqualTo(before);

    purchaseOrderService.markInTransit(order.getId());
    assertThat(productMapper.selectById(productId).getStock()).isEqualTo(before);

    purchaseOrderService.receive(order.getId());
    assertThat(productMapper.selectById(productId).getStock()).isEqualTo(before + 5);
    assertThat(stockRecordMapper.selectList(null)).anyMatch(
            record -> "PURCHASE_ORDER_RECEIVE".equals(record.getSourceType()));
}

@Test
void duplicateReceiveCannotIncreaseStockTwice() {
    PurchaseOrderResponse order = createPurchaseOrder();
    purchaseOrderService.order(order.getId());
    purchaseOrderService.markInTransit(order.getId());
    purchaseOrderService.receive(order.getId());
    assertThatThrownBy(() -> purchaseOrderService.receive(order.getId()))
            .isInstanceOf(BusinessException.class);
}
```

- [ ] **Step 2: Run purchase tests and verify current immediate-inbound behavior fails the new contract**

Run: `server\.\mvnw.cmd -Dtest=PurchaseOrderServiceIntegrationTest test`

Expected: lifecycle methods are missing and old behavior no longer matches tests.

- [ ] **Step 3: Add fields, migration, enum, and service contract**

```java
public enum PurchaseOrderStatus {
    DRAFT, ORDERED, IN_TRANSIT, RECEIVED, CANCELED
}

public interface PurchaseOrderService {
    PurchaseOrderResponse create(PurchaseOrderCreateRequest request);
    PurchaseOrderResponse createForAgent(AgentPurchaseOrderCommand command);
    PurchaseOrderResponse getById(Long id);
    PageResponse<PurchaseOrderResponse> pageList(String keyword, String status, long page, long size);
    void order(Long id);
    void markInTransit(Long id);
    void receive(Long id);
    void delete(Long id);
    PurchaseOrderResponse update(Long id, PurchaseOrderCreateRequest request);
    void cancel(Long id);
}
```

Add `agent_task_id`, `ordered_at`, `shipped_at`, `expected_arrival_at`, and `received_at`. The upgrade SQL maps existing `APPROVED` rows to `RECEIVED` before changing documentation or constraints. Add a unique key on `(agent_task_id, supplier_id)`; MySQL permits multiple manual rows because `agent_task_id` is null.

- [ ] **Step 4: Implement transactional lifecycle methods**

`receive` must conditionally change state and write stock in the same transaction:

```java
@Transactional
public void receive(Long id) {
    PurchaseOrder order = requireOrder(id, PurchaseOrderStatus.IN_TRANSIT);
    int changed = purchaseOrderMapper.update(null,
            new LambdaUpdateWrapper<PurchaseOrder>()
                    .eq(PurchaseOrder::getId, id)
                    .eq(PurchaseOrder::getStatus, PurchaseOrderStatus.IN_TRANSIT.name())
                    .set(PurchaseOrder::getStatus, PurchaseOrderStatus.RECEIVED.name())
                    .set(PurchaseOrder::getReceivedAt, LocalDateTime.now()));
    if (changed == 0) {
        throw new BusinessException("采购单状态已变化，请刷新后重试");
    }
    for (PurchaseOrderItem item : findItems(id)) {
        inventoryService.inbound(new InventoryChangeCommand(
                item.getProductId(), item.getQuantity(),
                "PURCHASE_ORDER_RECEIVE", order.getId(), order.getOrderNo(),
                "采购到货入库：" + order.getOrderNo()));
    }
}
```

`cancel` permits only `DRAFT`, `ORDERED`, or `IN_TRANSIT` and never adjusts stock. `createForAgent` copies `agentTaskId`, expected arrival, quote prices, and supplier data without exposing `agentTaskId` in public create DTOs.

- [ ] **Step 5: Replace Controller routes and update purchase UI copy**

Expose PATCH routes `/{id}/order`, `/{id}/ship`, and `/{id}/receive`. Update audit actions to `PURCHASE_ORDERED`, `PURCHASE_SHIPPED`, and `PURCHASE_RECEIVED`. Remove “审核即入库” copy from purchase pages and show the five-state progression.

- [ ] **Step 6: Run lifecycle, backend, and frontend verification**

Run: `server\.\mvnw.cmd -Dtest=PurchaseOrderServiceIntegrationTest test`

Expected: order/ship leave stock unchanged; receive changes it exactly once.

Run: `server\.\mvnw.cmd test`

Expected: all backend tests pass after updating old expectations.

Run: `npm run build:client`

Expected: Next.js production build succeeds with the new routes.

- [ ] **Step 7: Commit the lifecycle migration**

```bash
git add server/src client/src
git commit -m "feat: add real purchase delivery lifecycle"
```

### Task 6: Implement the deterministic replenishment workflow

**Files:**
- Create: `server/src/main/java/com/demo/erp/ai/service/ReplenishmentWorkflowService.java`
- Create: `server/src/main/java/com/demo/erp/ai/service/impl/ReplenishmentWorkflowServiceImpl.java`
- Create: `server/src/main/java/com/demo/erp/ai/service/AgentExecutionContextFactory.java`
- Create: `server/src/test/java/com/demo/erp/ai/ReplenishmentWorkflowIntegrationTest.java`

**Interfaces:**
- Consumes: `AgentTaskService`, `ReplenishmentDataService`, `PurchaseOrderService.createForAgent`, `AuditLogService`, and `AgentExecutionContext`.
- Produces: `start(CreateAgentTaskCommand)`, `run(String taskNo)`, `resume(String taskNo, BigDecimal oneTimeLimit)`, and `cancel(String taskNo)`.

- [ ] **Step 1: Write failing happy-path, amount-pause, and idempotency tests**

```java
@SpringBootTest
class ReplenishmentWorkflowIntegrationTest {
    @Autowired ReplenishmentWorkflowService workflow;
    @Autowired PurchaseOrderMapper purchaseOrderMapper;

    @Test
    void belowLimitCreatesOrderedSupplierOrders() {
        AgentTaskDetail task = workflow.start(command("workflow-happy", "20000.00"));
        assertThat(task.status()).isIn("WAITING_DELIVERY", "COMPLETED_WITH_WARNINGS");
        assertThat(purchaseOrderMapper.selectList(null))
                .allMatch(order -> "ORDERED".equals(order.getStatus()));
    }

    @Test
    void aboveLimitCreatesNoOrdersAndPausesWholeTask() {
        long before = purchaseOrderMapper.selectCount(null);
        AgentTaskDetail task = workflow.start(command("workflow-limit", "1.00"));
        assertThat(task.status()).isEqualTo("PAUSED_LIMIT");
        assertThat(purchaseOrderMapper.selectCount(null)).isEqualTo(before);
    }

    private CreateAgentTaskCommand command(String idempotencyKey, String amountLimit) {
        return new CreateAgentTaskCommand(
                "检查库存并完成今日补货",
                "MANUAL",
                idempotencyKey,
                new BigDecimal(amountLimit),
                new AgentExecutionContext(1L, "admin", "ADMIN"));
    }
}
```

- [ ] **Step 2: Run the workflow test and verify the orchestrator is missing**

Run: `server\.\mvnw.cmd -Dtest=ReplenishmentWorkflowIntegrationTest test`

Expected: compilation fails on missing workflow service.

- [ ] **Step 3: Implement the exact workflow state sequence**

```java
public interface ReplenishmentWorkflowService {
    AgentTaskDetail start(CreateAgentTaskCommand command);
    AgentTaskDetail run(String taskNo);
    AgentTaskDetail resume(String taskNo, BigDecimal oneTimeLimit,
                           AgentExecutionContext administrator);
    AgentTaskDetail cancel(String taskNo, AgentExecutionContext administrator);
}
```

`run` must execute this order: transition `PENDING → RUNNING`; append snapshot step; create and persist plan; copy `plannedAmount`; compare the whole plan to the task amount limit; transition to `PAUSED_LIMIT` without order writes when exceeded; group executable items by supplier; call `createForAgent` once per supplier; update plan-item order links; transition to `WAITING_DELIVERY`; record warnings for skipped items. If no products require replenishment, finish `SUCCEEDED` with zero orders.

`resume` requires `administrator.role() == "ADMIN"`, writes the one-time limit to the task, records an audit log, changes `PAUSED_LIMIT → RUNNING`, and executes frozen plan items without recalculation.

- [ ] **Step 4: Make retries idempotent and restart-safe**

Before each supplier order, query `(agent_task_id, supplier_id)`; use the unique key as the race-safe fallback. At application startup or scheduled recovery, `RUNNING` tasks resume from persisted plan/order links rather than replacing plan snapshots.

- [ ] **Step 5: Run focused and full tests**

Run: `server\.\mvnw.cmd -Dtest=ReplenishmentWorkflowIntegrationTest test`

Expected: happy, paused, resume, and repeated-run cases pass.

Run: `server\.\mvnw.cmd test`

Expected: all backend tests pass.

- [ ] **Step 6: Commit deterministic workflow execution**

```bash
git add server/src/main/java/com/demo/erp/ai server/src/test/java/com/demo/erp/ai
git commit -m "feat: execute idempotent replenishment workflows"
```

### Task 7: Add scheduling, `SYSTEM_AGENT`, and delivery simulation

**Files:**
- Modify: `server/src/main/java/com/demo/erp/DemoErpApplication.java`
- Modify: `server/src/main/java/com/demo/erp/enums/UserRole.java`
- Modify: `server/src/main/java/com/demo/erp/enums/UserStatus.java`
- Create: `server/src/main/java/com/demo/erp/ai/service/AgentPolicyService.java`
- Create: `server/src/main/java/com/demo/erp/ai/service/impl/AgentPolicyServiceImpl.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/AgentPolicyUpdateCommand.java`
- Create: `server/src/main/java/com/demo/erp/ai/scheduler/AgentReplenishmentScheduler.java`
- Create: `server/src/main/java/com/demo/erp/ai/scheduler/DeliverySimulationScheduler.java`
- Create: `server/src/main/java/com/demo/erp/ai/scheduler/AgentScheduleConfiguration.java`
- Modify: `server/src/main/resources/application.yml`
- Modify: `server/src/main/resources/db/init.sql`
- Modify: `server/src/test/resources/schema.sql`
- Create: `server/src/test/java/com/demo/erp/ai/AgentSchedulerIntegrationTest.java`
- Create: `server/src/test/java/com/demo/erp/ai/DeliverySimulationIntegrationTest.java`

**Interfaces:**
- Consumes: persisted `AgentPolicy`, `UserMapper`, workflow, and purchase lifecycle methods.
- Produces: `runDaily(LocalDate businessDate)` and `advanceEligibleOrders(LocalDateTime now)` methods that tests can call directly.

- [ ] **Step 1: Write failing scheduler and duplicate-delivery tests**

```java
@Test
void sameBusinessDateAndPolicyVersionCreatesOneScheduledTask() {
    scheduler.runDaily(LocalDate.of(2026, 7, 20));
    scheduler.runDaily(LocalDate.of(2026, 7, 20));
    assertThat(agentTaskMapper.selectList(null)).hasSize(1);
    assertThat(agentTaskMapper.selectList(null).getFirst().getExecutorRole())
            .isEqualTo("SYSTEM_AGENT");
}

@Test
void repeatedDeliveryTickReceivesAnOrderOnlyOnce() {
    deliveryScheduler.advanceEligibleOrders(LocalDateTime.of(2026, 7, 25, 9, 0));
    int afterFirst = productMapper.selectById(productId).getStock();
    deliveryScheduler.advanceEligibleOrders(LocalDateTime.of(2026, 7, 25, 9, 0));
    assertThat(productMapper.selectById(productId).getStock()).isEqualTo(afterFirst);
}
```

- [ ] **Step 2: Run both tests and verify scheduler components are absent**

Run: `server\.\mvnw.cmd -Dtest=AgentSchedulerIntegrationTest,DeliverySimulationIntegrationTest test`

Expected: compilation fails on missing schedulers.

- [ ] **Step 3: Add internal identity and policy service**

Add `SYSTEM_AGENT` to `UserRole`, `SYSTEM` to `UserStatus`, and seed user `system_agent` with status `SYSTEM` and an unusable random BCrypt hash. Existing login already accepts only `ACTIVE`, so this account cannot log in.

`AgentPolicyService` provides `current()` and `update(AgentPolicyUpdateCommand, AgentExecutionContext)`; update requires ADMIN, increments the policy version, and writes an audit log.

- [ ] **Step 4: Enable scheduling and implement deterministic entry points**

Add `@EnableScheduling` to `DemoErpApplication`. `AgentScheduleConfiguration` implements `SchedulingConfigurer` and registers a trigger task whose next execution is calculated with `new CronTrigger(agentPolicyService.current().cronExpression()).nextExecution(triggerContext)`, so a persisted Cron update is used without restarting the app. `runDaily` returns immediately when policy is disabled, then creates idempotency key `AUTO_REPLENISH:{date}:{policyVersion}` and calls the workflow with `SYSTEM_AGENT` context.

`advanceEligibleOrders(now)` changes overdue `ORDERED` orders to `IN_TRANSIT`, then receives `IN_TRANSIT` orders whose `expectedArrivalAt <= now`. It calls public service methods, never mappers, for state changes.

- [ ] **Step 5: Run scheduler, full backend, and context tests**

Run: `server\.\mvnw.cmd -Dtest=AgentSchedulerIntegrationTest,DeliverySimulationIntegrationTest,DemoErpApplicationTests test`

Expected: one scheduled task per key, one stock receipt per order, and context startup success.

Run: `server\.\mvnw.cmd test`

Expected: all backend tests pass.

- [ ] **Step 6: Commit scheduling and simulation**

```bash
git add server/src/main/java server/src/main/resources server/src/test
git commit -m "feat: schedule replenishment and simulated delivery"
```

### Task 8: Integrate Spring AI, DeepSeek tools, and rule fallback

**Files:**
- Modify: `server/pom.xml`
- Modify: `server/src/main/resources/application.yml`
- Modify: `server/src/test/resources/application.yml`
- Modify: `.env.example`
- Create: `server/src/main/java/com/demo/erp/ai/config/AiProperties.java`
- Create: `server/src/main/java/com/demo/erp/ai/config/AiConfiguration.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/ReplenishmentGoal.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/AgentSubmissionResult.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/AgentTaskToolResult.java`
- Create: `server/src/main/java/com/demo/erp/ai/model/AgentModelClient.java`
- Create: `server/src/main/java/com/demo/erp/ai/model/SpringAiAgentModelClient.java`
- Create: `server/src/main/java/com/demo/erp/ai/tools/ErpAgentTools.java`
- Create: `server/src/main/java/com/demo/erp/ai/service/AgentConversationService.java`
- Create: `server/src/main/java/com/demo/erp/ai/service/impl/AgentConversationServiceImpl.java`
- Create: `server/src/test/java/com/demo/erp/ai/AgentConversationServiceTest.java`
- Create: `server/src/test/java/com/demo/erp/ai/ErpAgentToolsTest.java`

**Interfaces:**
- Consumes: Spring AI `ChatClient`, `ToolContext`, and the deterministic workflow.
- Produces: `AgentConversationService.submit(goal, idempotencyKey, executionContext)` with a task number even when the model fails or does not call the write tool.

- [ ] **Step 1: Write failing model-failure and hidden-context tests**

```java
@ExtendWith(MockitoExtension.class)
class AgentConversationServiceTest {
    @Mock AgentModelClient modelClient;
    @Mock ReplenishmentWorkflowService workflow;
    @Mock AgentTaskService taskService;

    @Test
    void modelFailureFallsBackToTheSameDeterministicWorkflow() {
        when(modelClient.run(anyString(), anyMap())).thenThrow(new RuntimeException("timeout"));
        AgentTaskDetail persisted = mock(AgentTaskDetail.class);
        when(persisted.taskNo()).thenReturn("AT202607200001");
        when(workflow.start(any())).thenReturn(persisted);

        AgentConversationService service = new AgentConversationServiceImpl(
                modelClient, workflow, taskService);
        AgentSubmissionResult result = service.submit(
                "检查库存并完成今日补货", "manual-1",
                new AgentExecutionContext(1L, "admin", "ADMIN"));

        assertThat(result.taskNo()).isEqualTo("AT202607200001");
        assertThat(result.fallbackUsed()).isTrue();
        verify(workflow).start(any());
    }
}
```

- [ ] **Step 2: Run tests and verify Spring AI boundaries are absent**

Run: `server\.\mvnw.cmd -Dtest=AgentConversationServiceTest,ErpAgentToolsTest test`

Expected: compilation fails on missing model, tools, and conversation services.

- [ ] **Step 3: Add Spring AI 2.0.0 dependency management and safe configuration**

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-bom</artifactId>
            <version>2.0.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-openai</artifactId>
</dependency>
```

Use `spring.ai.openai.base-url=${DEEPSEEK_BASE_URL:https://api.deepseek.com}`, `api-key=${DEEPSEEK_API_KEY:not-configured}`, and `chat.model=${DEEPSEEK_MODEL:deepseek-v4-flash}`. Tests set `erp.ai.enabled=false` and never make network calls.

- [ ] **Step 4: Implement tools with invisible `ToolContext` identity**

```java
@Component
public class ErpAgentTools {
    @Tool(name = "execute_replenishment_task",
          description = "Start the deterministic ERP replenishment workflow. Use for an explicit replenishment goal.")
    public AgentTaskToolResult execute(
            ReplenishmentGoal goal,
            ToolContext toolContext) {
        Map<String, Object> context = toolContext.getContext();
        AgentExecutionContext executor = new AgentExecutionContext(
                ((Number) context.get("userId")).longValue(),
                (String) context.get("username"),
                (String) context.get("role"));
        if (!executor.isAdminOrSystem()) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权执行自主补货任务");
        }
        String idempotencyKey = (String) context.get("idempotencyKey");
        return AgentTaskToolResult.from(workflow.start(
                CreateAgentTaskCommand.manual(goal.originalGoal(), idempotencyKey, executor)));
    }
}
```

Add read-only `query_inventory_risks`, `query_sales_demand`, `query_supplier_quotes`, `preview_replenishment`, and `get_agent_task_status` methods. Tool context contains identity and idempotency data and is not included in model-visible parameters.

- [ ] **Step 5: Implement `ChatClient` and deterministic fallback**

```java
public String run(String goal, Map<String, Object> context) {
    return chatClient.prompt()
            .system("你是AsterFlow ERP自主补货Agent。只能使用已注册工具；不得编造库存、数量、价格或身份。")
            .user(goal)
            .tools(erpAgentTools)
            .toolContext(context)
            .call()
            .content();
}
```

After the model call, `AgentConversationServiceImpl` queries the task by idempotency key. If the model failed, returned invalid content, or did not call the write tool, it calls `workflow.start` directly with the same key. The final response uses the persisted task as truth and treats model text only as display copy.

- [ ] **Step 6: Run AI boundary and full backend tests**

Run: `server\.\mvnw.cmd -Dtest=AgentConversationServiceTest,ErpAgentToolsTest,DemoErpApplicationTests test`

Expected: fallback and role tests pass without a DeepSeek key.

Run: `server\.\mvnw.cmd test`

Expected: all backend tests pass without network calls.

- [ ] **Step 7: Commit Spring AI integration**

```bash
git add server/pom.xml server/src .env.example
git commit -m "feat: connect DeepSeek agent with safe fallback"
```

### Task 9: Expose admin APIs and resumable SSE task events

**Files:**
- Create: `server/src/main/java/com/demo/erp/ai/web/AgentTaskController.java`
- Create: `server/src/main/java/com/demo/erp/ai/web/AgentPolicyController.java`
- Create: `server/src/main/java/com/demo/erp/ai/web/AgentTaskEventHub.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/SubmitAgentTaskRequest.java`
- Create: `server/src/main/java/com/demo/erp/ai/domain/ResumeAgentTaskRequest.java`
- Modify: `server/src/main/java/com/demo/erp/ai/service/impl/AgentTaskServiceImpl.java`
- Create: `server/src/test/java/com/demo/erp/ai/AgentTaskControllerIntegrationTest.java`

**Interfaces:**
- Consumes: conversation service, workflow, policy service, request attributes from `JwtInterceptor`, and `ApiResponse`.
- Produces: `/api/agent/tasks`, task detail/history/resume/cancel, `/events`, and `/api/agent/policy`.

- [ ] **Step 1: Write failing MockMvc tests for 202, role checks, resume, and events**

```java
@SpringBootTest
@AutoConfigureMockMvc
class AgentTaskControllerIntegrationTest {
    @Autowired MockMvc mvc;

    @Test
    void adminSubmissionReturnsAcceptedTask() throws Exception {
        mvc.perform(post("/api/agent/tasks")
                        .header("Authorization", adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"goal":"检查库存并完成今日补货","idempotencyKey":"api-1"}
                            """))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.taskNo").isNotEmpty());
    }

    @Test
    void staffCannotStartAutonomousWriteTask() throws Exception {
        mvc.perform(post("/api/agent/tasks")
                        .header("Authorization", staffToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"goal\":\"自动补货\",\"idempotencyKey\":\"api-2\"}"))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 2: Run the test and verify routes are missing**

Run: `server\.\mvnw.cmd -Dtest=AgentTaskControllerIntegrationTest test`

Expected: 404 or compilation failure before controllers exist.

- [ ] **Step 3: Implement exact HTTP contracts and ADMIN checks**

`POST /api/agent/tasks` builds `AgentExecutionContext` from request attributes, calls `AuthUtil.requireAdmin`, returns `ResponseEntity.status(202).body(ApiResponse.success(result))`. Resume accepts `{ "oneTimeAmountLimit": 25000.00 }`, requires ADMIN, and rechecks the frozen plan against that value. Cancel refuses tasks with any `RECEIVED` order.

Policy GET/PUT is ADMIN-only. PUT validates Cron syntax, positive amount, `lookbackDays` from 1 to 365, and `safetyDays` from 0 to 90.

- [ ] **Step 4: Publish sanitized persisted steps through `SseEmitter`**

```java
public SseEmitter subscribe(String taskNo) {
    SseEmitter emitter = new SseEmitter(30 * 60_000L);
    emitters.computeIfAbsent(taskNo, key -> new CopyOnWriteArrayList<>()).add(emitter);
    emitter.onCompletion(() -> remove(taskNo, emitter));
    emitter.onTimeout(() -> remove(taskNo, emitter));
    return emitter;
}

public void publish(String taskNo, AgentTaskStepResponse step) {
    for (SseEmitter emitter : emitters.getOrDefault(taskNo, List.of())) {
        try {
            emitter.send(SseEmitter.event().name("task-step").data(step));
        } catch (IOException ex) {
            remove(taskNo, emitter);
        }
    }
}
```

`AgentTaskServiceImpl.appendStep` persists first and publishes second. A dropped connection loses no durable state because clients always fetch task detail before reconnecting.

- [ ] **Step 5: Run controller, OpenAPI, and full backend tests**

Run: `server\.\mvnw.cmd -Dtest=AgentTaskControllerIntegrationTest,OpenApiDocumentationTests test`

Expected: admin/forbidden/status/event contracts pass and OpenAPI still generates.

Run: `server\.\mvnw.cmd test`

Expected: all backend tests pass.

- [ ] **Step 6: Commit Agent APIs**

```bash
git add server/src/main/java/com/demo/erp/ai server/src/test/java/com/demo/erp/ai
git commit -m "feat: expose agent tasks and live events"
```

### Task 10: Build the chat-first Agent console and quote maintenance UI

**Files:**
- Modify: `client/package.json`
- Modify: `package-lock.json`
- Modify: `client/src/components/Layout.tsx`
- Modify: `client/src/styles/globals.css`
- Create: `client/src/lib/agent-api.ts`
- Create: `client/src/lib/agent-stream.ts`
- Create: `client/src/components/agent/AgentConversation.tsx`
- Create: `client/src/components/agent/AgentTaskSidebar.tsx`
- Create: `client/src/components/agent/AgentTaskTimeline.tsx`
- Create: `client/src/components/agent/AmountLimitCard.tsx`
- Create: `client/src/components/agent/AgentPolicyPanel.tsx`
- Create: `client/src/pages/agent.tsx`
- Create: `client/src/pages/supplier-quotes.tsx`
- Create: `client/src/pages/api/agent/tasks/index.ts`
- Create: `client/src/pages/api/agent/tasks/[taskNo]/index.ts`
- Create: `client/src/pages/api/agent/tasks/[taskNo]/events.ts`
- Create: `client/src/pages/api/agent/tasks/[taskNo]/resume.ts`
- Create: `client/src/pages/api/agent/tasks/[taskNo]/cancel.ts`
- Create: `client/src/pages/api/agent/policy.ts`
- Create: `client/src/pages/api/supplier-product-quotes/index.ts`
- Create: `client/src/pages/api/supplier-product-quotes/[id].ts`
- Create: `client/src/components/agent/AgentConversation.test.tsx`
- Create: `client/src/lib/agent-stream.test.ts`
- Create: `client/vitest.config.ts`

**Interfaces:**
- Consumes: backend API contracts from Task 9 and existing `apiRequest`, `buildBackendUrl`, `forwardBackendResponse`, and `Layout` patterns.
- Produces: `/agent`, `/supplier-quotes`, typed API helpers, and an authenticated SSE stream reader.

- [ ] **Step 1: Install and configure Vitest, then write failing UI tests**

Add scripts `test:client` and `test:client:watch`; install `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event` as dev dependencies.

```tsx
it('submits a natural-language goal and renders returned task progress', async () => {
  const submit = vi.fn().mockResolvedValue({
    taskNo: 'AT202607200001', status: 'RUNNING', fallbackUsed: false,
  });
  render(<AgentConversation submitGoal={submit} events={[]} />);

  await userEvent.type(screen.getByRole('textbox'), '检查库存并完成今日补货');
  await userEvent.click(screen.getByRole('button', { name: '执行目标' }));

  expect(submit).toHaveBeenCalledWith('检查库存并完成今日补货');
  expect(await screen.findByText('AT202607200001')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run frontend tests and verify missing components fail**

Run: `npm run test:client -- --run`

Expected: compilation fails because Agent components do not exist.

- [ ] **Step 3: Implement typed API requests and authenticated fetch-based SSE**

```ts
export async function streamAgentEvents(
  taskNo: string,
  token: string,
  onEvent: (event: AgentTaskEvent) => void,
  signal: AbortSignal,
) {
  const response = await fetch(`/api/agent/tasks/${taskNo}/events`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!response.ok || !response.body) throw new Error('无法连接Agent任务事件流');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() || '';
    for (const frame of frames) {
      const data = frame.split('\n').find((line) => line.startsWith('data:'));
      if (data) onEvent(JSON.parse(data.slice(5).trim()));
    }
  }
}
```

The Next events proxy forwards `Authorization`, sets `Content-Type: text/event-stream`, disables buffering/caching, reads the backend body, and writes each chunk to `NextApiResponse` until abort.

- [ ] **Step 4: Implement the approved A layout and admin-only navigation**

The page main column contains conversation bubbles, step messages, task links, and the goal composer. The right column contains current status, planned amount, task limit, model/rule badge, and next schedule. A paused task shows `AmountLimitCard` with one-time limit input, resume, and cancel actions. Refresh first loads task detail and then reconnects the stream.

Add `智能 Agent` and `供应商报价` to `navItems`; render them only when `role === 'ADMIN'`. Keep server-side ADMIN checks as the authority.

- [ ] **Step 5: Implement quote and policy forms with exact validation copy**

Quote form fields are supplier, product, purchase price, lead days, MOQ, quality score, preferred, and status. Policy fields are enable switch, Cron, task amount limit, lookback days, safety days, and delivery simulation. Show backend validation messages without replacing them with generic errors.

- [ ] **Step 6: Run frontend tests and production build**

Run: `npm run test:client -- --run`

Expected: Agent conversation and stream parsing tests pass.

Run: `npm run build:client`

Expected: Next.js production build succeeds and includes `/agent` and `/supplier-quotes`.

- [ ] **Step 7: Commit the frontend Agent experience**

```bash
git add client package-lock.json
git commit -m "feat: add autonomous agent console"
```

### Task 11: Complete end-to-end verification, CI, and shipped documentation

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/TESTING_GUIDE.md`
- Modify: `docs/INTERVIEW_SCRIPT.md`
- Modify: `docs/PROJECT_ROADMAP.md`
- Create: `docs/AGENT_OPERATIONS.md`
- Create: `server/src/test/java/com/demo/erp/ai/AutonomousReplenishmentEndToEndTest.java`

**Interfaces:**
- Consumes: every backend and frontend slice.
- Produces: one automated proof of the full business loop, operational instructions, CI enforcement, and interview-safe shipped claims.

- [ ] **Step 1: Write the final failing end-to-end test**

```java
@SpringBootTest
class AutonomousReplenishmentEndToEndTest {
    @Autowired ReplenishmentWorkflowService workflow;
    @Autowired DeliverySimulationScheduler delivery;
    @Autowired AgentTaskService tasks;

    @Test
    void goalToReceivedStockIsAuditableAndExactlyOnce() {
        AgentTaskDetail started = workflow.start(adminCommand("e2e-agent-1", "20000.00"));
        assertThat(started.status()).isEqualTo("WAITING_DELIVERY");

        delivery.advanceEligibleOrders(LocalDateTime.now().plusDays(30));
        delivery.advanceEligibleOrders(LocalDateTime.now().plusDays(30));

        AgentTaskDetail finished = tasks.findByTaskNo(started.taskNo());
        assertThat(finished.status()).isIn("SUCCEEDED", "COMPLETED_WITH_WARNINGS");
        assertThat(finished.steps()).extracting(AgentTaskStepResponse::stage)
                .contains("PLAN_CREATED", "ORDERS_CREATED", "DELIVERY_RECEIVED");
        assertThat(finished.purchaseOrders()).allMatch(order -> "RECEIVED".equals(order.status()));
    }

    private CreateAgentTaskCommand adminCommand(String idempotencyKey, String amountLimit) {
        return new CreateAgentTaskCommand(
                "检查库存并完成今日补货",
                "MANUAL",
                idempotencyKey,
                new BigDecimal(amountLimit),
                new AgentExecutionContext(1L, "admin", "ADMIN"));
    }
}
```

- [ ] **Step 2: Run the end-to-end test and close any missing transition or audit link**

Run: `server\.\mvnw.cmd -Dtest=AutonomousReplenishmentEndToEndTest test`

Expected: one complete task reaches received state, all generated orders link back to its task, and the second delivery tick changes nothing.

- [ ] **Step 3: Enforce frontend tests in CI**

Insert `npm run test:client -- --run` after `npm ci` and before `npm run build:client`. Keep the existing Java 21 `./mvnw -B clean verify` backend job.

- [ ] **Step 4: Write operations and interview documentation**

`docs/AGENT_OPERATIONS.md` must document environment variables, safe startup with AI disabled, DeepSeek-enabled startup, quote and policy setup, manual trigger, scheduled trigger, task recovery, amount pause recovery, and delivery simulation. Update the roadmap to mark only implemented items complete. Update interview copy to explain deterministic calculations, ToolContext identity, fallback, idempotency, and why the model never writes inventory directly.

- [ ] **Step 5: Run the complete local verification matrix**

Run: `npm run test:client -- --run`

Expected: all frontend tests pass.

Run: `npm run build:client`

Expected: production build succeeds.

Run: `server\.\mvnw.cmd -B clean verify`

Expected: all backend tests pass and the JAR is built.

Run: `rg -n "DEEPSEEK_API_KEY=.{8}|sk-[A-Za-z0-9]" . --glob '!node_modules/**' --glob '!target/**'`

Expected: no committed secret values are found; only variable names and documentation examples without real keys may appear.

- [ ] **Step 6: Perform a manual smoke test with DeepSeek and fallback modes**

1. Start with `ERP_AI_ENABLED=false`, submit a replenishment goal, and verify the UI displays `规则模式` while the task completes.
2. Start with `ERP_AI_ENABLED=true` and a user-provided `DEEPSEEK_API_KEY`, submit a new idempotency key, and verify tool execution creates a persisted task.
3. Set a one-time amount limit below the plan total and verify zero purchase orders are created before resume.
4. Advance delivery simulation and verify stock and audit history change once.

- [ ] **Step 7: Commit final verification and docs**

```bash
git add .github README.md docs server/src/test
git commit -m "docs: verify and document autonomous replenishment"
```

## Final Review Gate

- [ ] Confirm every design acceptance criterion maps to at least one automated test above.
- [ ] Confirm no `APPROVED` purchase behavior or “审核即入库” copy remains.
- [ ] Confirm `SYSTEM_AGENT` cannot authenticate through `/api/auth/login`.
- [ ] Confirm task amount is checked before the first order insert.
- [ ] Confirm repeated task submission, restart recovery, and repeated receipt are idempotent.
- [ ] Confirm model output is never used as the authoritative task, quantity, price, identity, or status.
- [ ] Confirm all code and documentation remain UTF-8 and Chinese text is readable.
- [ ] Confirm current Git remote matches the intended repository before any push.

## Official References

- Spring AI OpenAI Chat: <https://docs.spring.io/spring-ai/reference/api/chat/openai-chat.html>
- Spring AI ChatClient: <https://docs.spring.io/spring-ai/reference/api/chatclient.html>
- Spring AI Tool Calling and ToolContext: <https://docs.spring.io/spring-ai/reference/api/tools.html>
- Spring AI Structured Output: <https://docs.spring.io/spring-ai/reference/api/structured-output-converter.html>
- DeepSeek OpenAI-compatible API: <https://api-docs.deepseek.com/zh-cn/>
- DeepSeek Tool Calls: <https://api-docs.deepseek.com/zh-cn/guides/tool_calls>
