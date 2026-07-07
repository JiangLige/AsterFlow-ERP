# AsterFlow ERP Completion, Spring AI, Redis, and Concurrency Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring AsterFlow ERP from feature-complete to interview-ready by finishing frontend flows, hardening backend business rules, adding Redis-backed reliability features, and then integrating Spring AI safely.

**Architecture:** Finish the normal ERP system first, then add AI as a layer on top of existing services. The database remains the source of truth; Redis is used for cache, sessions, rate limiting, and idempotency; Spring AI only reads ERP data in the first version and never bypasses service-layer rules.

**Tech Stack:** Java 21, Spring Boot 4.0.5, Spring MVC, MyBatis-Plus, MySQL 8, Redis, Next.js 16, React 19, TypeScript, Spring AI 2.0.x.

## Global Constraints

- Do not commit secrets. `OPENAI_API_KEY`, `JWT_SECRET`, database password, and Redis password must come from environment variables.
- Spring AI version target: `2.0.0`, because the official docs state Spring AI 2.0.x supports Spring Boot 4.0.x and 4.1.x.
- Use existing backend layering: `controller -> service -> mapper -> entity`.
- Do not let Spring AI call mappers directly. AI must call service methods or read prepared DTOs.
- Redis is not the business source of truth. It can speed up reads and coordinate requests, but MySQL transactions protect inventory/order correctness.
- For backend and Spring AI implementation, generate code directly. Do not ask the user to write code manually except using IDE getter/setter generation if needed.
- Every implementation slice must end with verification: backend `mvnw.cmd -B clean verify`; frontend `npm --workspace client run lint` and `npm run build:client`.

---

## Basic Concepts

### What Redis Should Do Here

Redis is an in-memory data store. In this project it should be used for four things:

1. **Session store:** keep login sessions and refresh tokens so logout/expiration works across backend restarts or multiple instances.
2. **Cache:** store expensive read results like dashboard summary for a short time.
3. **Rate limiting:** count requests per user/IP in a time window, then reject excessive traffic with HTTP 429.
4. **Idempotency:** prevent duplicate approve/cancel/stock-adjust operations caused by double-clicks or retries.

Redis should not replace MySQL for orders, stock, customers, suppliers, or audit logs.

### What High Concurrency Means Here

High concurrency means multiple users or requests hit the same business data at the same time. For ERP, the risky cases are:

- Two users approve the same sale order.
- Two sale orders deduct the same product stock.
- A user double-clicks approve/cancel.
- Dashboard and list APIs are requested frequently.

The correct answer is not "use Redis everywhere". The correct order is:

1. MySQL transaction protects data consistency.
2. SQL conditional update prevents duplicate status transitions.
3. Optimistic locking or atomic stock update prevents overselling.
4. Redis reduces repeated traffic and duplicate requests.

### What Spring AI Should Do First

Spring AI should start as a read-only assistant:

- summarize dashboard data;
- explain low-stock risks;
- suggest replenishment;
- summarize audit logs;
- generate order remarks.

It should not create, approve, cancel, or delete orders in v1.

---

## Official Sources To Follow

- Spring AI getting started and BOM: https://docs.spring.io/spring-ai/reference/getting-started.html
- Spring AI OpenAI starter and properties: https://docs.spring.io/spring-ai/reference/api/chat/openai-chat.html
- Spring AI ChatClient: https://docs.spring.io/spring-ai/reference/api/chatclient.html
- Spring AI Tool Calling: https://docs.spring.io/spring-ai/reference/api/tools.html
- Spring AI Structured Output: https://docs.spring.io/spring-ai/reference/api/structured-output-converter.html
- Redis rate limiting concept and Lua atomicity: https://redis.io/tutorials/rate-limiting-in-java-spring-with-redis/

---

## Phase 1: Frontend Completion

### Task 1: Complete CRUD Page Consistency

**Purpose:** Make all visible navigation entries lead to working pages.

**Files:**
- Modify: `client/src/pages/products.tsx`
- Modify: `client/src/pages/suppliers.tsx`
- Modify: `client/src/pages/customers.tsx`
- Modify: `client/src/pages/purchase-orders.tsx`
- Modify: `client/src/pages/sale-orders.tsx`
- Modify as needed: `client/src/pages/*/[id]/edit.tsx`

**Acceptance Criteria:**
- [ ] Every list page has working create, edit, status, and delete/cancel/approve actions where the backend supports them.
- [ ] Every edit page loads the correct entity type.
- [ ] Every page uses existing `apiRequest` so token refresh remains centralized.
- [ ] No page contains copy-paste domain mismatch like supplier page calling sale-order API.

**Implementation Steps:**
- [ ] Audit all `Link href=` targets under `client/src/pages`.
- [ ] For each page, verify the matching `client/src/pages/api/**` proxy exists.
- [ ] Fix missing proxies before changing UI.
- [ ] Run `npm --workspace client run lint`.
- [ ] Run `npm run build:client`.

### Task 2: Add Frontend Route Guard

**Purpose:** Prevent users from entering protected pages when not logged in.

**Files:**
- Modify: `client/src/components/Layout.tsx`
- Optional create: `client/src/lib/auth.ts`

**Acceptance Criteria:**
- [ ] Pages inside `Layout` redirect to `/login` when no access token exists.
- [ ] `/login` remains accessible.
- [ ] Logout clears all auth storage and returns to `/login`.
- [ ] Role-based button hiding still works.

**Suggested Code Shape:**

```tsx
export function hasAccessToken() {
    if (typeof window === 'undefined') {
        return false;
    }

    return Boolean(localStorage.getItem('accessToken') || localStorage.getItem('token'));
}
```

### Task 3: Improve Frontend Error and Loading States

**Purpose:** Make project flow understandable when API fails or data is empty.

**Files:**
- Modify: `client/src/components/Layout.tsx`
- Create: `client/src/components/EmptyState.tsx`
- Create: `client/src/components/ErrorMessage.tsx`
- Modify list pages to reuse them.

**Acceptance Criteria:**
- [ ] Empty tables show a friendly empty message instead of blank rows.
- [ ] API errors render consistently.
- [ ] Loading state does not block the whole page forever.

---

## Phase 2: Backend Business Hardening

### Task 4: Standardize Page Parameter Limits

**Purpose:** Prevent very large page sizes from causing memory and database pressure.

**Files:**
- Create: `server/src/main/java/com/asterflow/erp/common/PageRequestUtil.java`
- Modify services with `pageList(...)`
- Test: service integration tests for page boundaries

**Acceptance Criteria:**
- [ ] `page < 1` becomes `1`.
- [ ] `size < 1` becomes `10`.
- [ ] `size > 100` becomes `100`.
- [ ] All list APIs still return `PageResponse`.

**Suggested Code:**

```java
package com.asterflow.erp.common;

public final class PageRequestUtil {

    private PageRequestUtil() {
    }

    public static long normalizePage(long page) {
        return page < 1 ? 1 : page;
    }

    public static long normalizeSize(long size) {
        if (size < 1) {
            return 10;
        }
        return Math.min(size, 100);
    }
}
```

### Task 5: Add Enum Validation Helpers

**Purpose:** Avoid invalid status/type strings entering query/update logic.

**Files:**
- Create: `server/src/main/java/com/asterflow/erp/common/EnumValidator.java`
- Modify: product, supplier, customer, purchase-order, sale-order services.

**Acceptance Criteria:**
- [ ] Invalid status returns `BusinessException`.
- [ ] Blank status remains optional for list filters.
- [ ] Existing tests pass.

**Suggested Code:**

```java
package com.asterflow.erp.common;

public final class EnumValidator {

    private EnumValidator() {
    }

    public static <E extends Enum<E>> String requireValid(Class<E> enumType, String value, String message) {
        if (value == null || value.isBlank()) {
            return value;
        }

        try {
            return Enum.valueOf(enumType, value).name();
        } catch (IllegalArgumentException e) {
            throw new BusinessException(message);
        }
    }
}
```

### Task 6: Harden Stock Deduction Against Overselling

**Purpose:** Make sale approval safe when two requests deduct the same product stock.

**Files:**
- Modify: `server/src/main/java/com/asterflow/erp/mapper/ProductMapper.java`
- Modify: `server/src/main/java/com/asterflow/erp/service/impl/InventoryServiceImpl.java`
- Test: `server/src/test/java/com/asterflow/erp/service/SaleOrderServiceIntegrationTest.java`

**Acceptance Criteria:**
- [ ] Stock deduction uses conditional SQL: update only when `stock >= quantity`.
- [ ] If update count is `0`, throw stock-not-enough business error.
- [ ] Sale approval remains transactional.

**Suggested Mapper Method:**

```java
int deductStockIfEnough(@Param("productId") Long productId, @Param("quantity") Integer quantity);
```

**Suggested SQL Annotation:**

```java
@Update("""
        UPDATE product
        SET stock = stock - #{quantity}
        WHERE id = #{productId}
          AND stock >= #{quantity}
        """)
int deductStockIfEnough(@Param("productId") Long productId, @Param("quantity") Integer quantity);
```

### Task 7: Add Idempotency For Dangerous Operations

**Purpose:** Prevent repeated approve/cancel/stock-adjust from double-clicks or frontend retry.

**Files:**
- Create: `server/src/main/java/com/asterflow/erp/service/IdempotencyService.java`
- Create: `server/src/main/java/com/asterflow/erp/service/impl/RedisIdempotencyServiceImpl.java`
- Modify controllers for approve/cancel/stock adjust.

**Acceptance Criteria:**
- [ ] Client can send `Idempotency-Key` header.
- [ ] Same user + same key + same action is accepted once within TTL.
- [ ] Duplicate request returns a clear business error.

**Suggested Code:**

```java
public interface IdempotencyService {
    void requireFirstExecution(String scope, String key);
}
```

```java
@Service
public class RedisIdempotencyServiceImpl implements IdempotencyService {

    private final StringRedisTemplate redisTemplate;

    public RedisIdempotencyServiceImpl(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void requireFirstExecution(String scope, String key) {
        if (key == null || key.isBlank()) {
            return;
        }

        String redisKey = "erp:idempotency:" + scope + ":" + key;
        Boolean success = redisTemplate.opsForValue()
                .setIfAbsent(redisKey, "1", Duration.ofMinutes(10));

        if (!Boolean.TRUE.equals(success)) {
            throw new BusinessException("请勿重复提交");
        }
    }
}
```

---

## Phase 3: Redis and High Concurrency

### Task 8: Make Redis Optional But Production-Ready

**Purpose:** Keep local development simple while supporting Redis in production.

**Files:**
- Modify: `server/src/main/resources/application.yml`
- Modify: `.env.example`
- Modify Redis-backed services if profile conditions are missing.

**Acceptance Criteria:**
- [ ] Local can run without Redis if `ERP_AUTH_SESSION_STORE=local`.
- [ ] Production can use Redis for session and cache.
- [ ] Startup failure message is clear when Redis mode is enabled but Redis is unavailable.

### Task 9: Add Redis Rate Limiting Interceptor

**Purpose:** Protect login and write APIs from excessive requests.

**Files:**
- Create: `server/src/main/java/com/asterflow/erp/interceptor/RateLimitInterceptor.java`
- Modify: `server/src/main/java/com/asterflow/erp/config/WebConfig.java`
- Create tests around interceptor behavior.

**Acceptance Criteria:**
- [ ] Login endpoint has stricter limit, for example 10 requests/minute per IP.
- [ ] Normal API endpoints have user/IP based limit, for example 120 requests/minute.
- [ ] Exceeding the limit returns HTTP 429.
- [ ] Redis increment and expire are atomic or Lua-backed.

**Learning Note:** Rate limiting needs shared state when the backend has more than one instance. Redis works because every instance increments the same key.

### Task 10: Cache Dashboard Summary With TTL and Invalidation

**Purpose:** Reduce repeated dashboard query cost while keeping business data fresh.

**Files:**
- Modify: `DashboardServiceImpl`
- Modify: `RedisDashboardCacheServiceImpl`
- Ensure mutation services evict dashboard cache.

**Acceptance Criteria:**
- [ ] Dashboard cache TTL is configurable.
- [ ] Product/order/stock changes evict dashboard cache.
- [ ] If Redis fails, dashboard returns fresh DB result instead of failing the whole request.

---

## Phase 4: Spring AI Read-Only Assistant

### Task 11: Add Spring AI Dependencies and Configuration

**Purpose:** Enable Spring AI OpenAI ChatClient without hardcoding keys.

**Files:**
- Modify: `server/pom.xml`
- Modify: `server/src/main/resources/application.yml`
- Modify: `.env.example`

**Acceptance Criteria:**
- [x] Maven uses Spring AI BOM `2.0.0`.
- [x] Add `spring-ai-starter-model-openai`.
- [x] API key reads from `OPENAI_API_KEY`.
- [x] App can start without exposing key in git.

**Suggested Maven Code:**

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
```

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-openai</artifactId>
</dependency>
```

**Suggested YAML:**

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY:}
      chat:
        model: ${OPENAI_CHAT_MODEL:gpt-5-mini}
```

### Task 12: Add AI DTOs

**Purpose:** Keep AI output stable and frontend-friendly.

**Files:**
- Create: `server/src/main/java/com/asterflow/erp/dto/ai/AiInventoryAdviceResponse.java`
- Create: `server/src/main/java/com/asterflow/erp/dto/ai/AiDashboardSummaryResponse.java`

**Acceptance Criteria:**
- [x] DTOs contain simple fields, not raw model text only.
- [x] Frontend can render fields directly.

**Suggested DTO Fields:**

```java
public class AiInventoryAdviceResponse {
    private String summary;
    private List<String> risks;
    private List<String> replenishmentSuggestions;
    private List<String> nextActions;
}
```

### Task 13: Add Read-Only AI Assistant Service

**Purpose:** Generate business suggestions from existing ERP data.

**Files:**
- Create: `server/src/main/java/com/asterflow/erp/service/AiAssistantService.java`
- Create: `server/src/main/java/com/asterflow/erp/service/impl/AiAssistantServiceImpl.java`
- Use existing: `DashboardService`, `ProductService`, `StockRecordService` if needed.

**Acceptance Criteria:**
- [ ] Service reads data from existing services only.
- [ ] Service does not inject mappers.
- [ ] Prompt tells AI to only use provided ERP data.
- [ ] If AI call fails, return clear business error or fallback message.

**Suggested Service Code:**

```java
@Service
public class AiAssistantServiceImpl implements AiAssistantService {

    private final ChatClient chatClient;
    private final DashboardService dashboardService;
    private final ProductService productService;

    public AiAssistantServiceImpl(ChatClient.Builder chatClientBuilder,
                                  DashboardService dashboardService,
                                  ProductService productService) {
        this.chatClient = chatClientBuilder
                .defaultSystem("""
                        你是 AsterFlow ERP 的经营分析助手�?                        你只能根据系统提供的数据回答，不要编造库存、销售额或订单�?                        输出要简洁，适合企业管理者阅读�?                        """)
                .build();
        this.dashboardService = dashboardService;
        this.productService = productService;
    }

    @Override
    public String inventoryAdvice() {
        var dashboard = dashboardService.summary();
        var warnings = productService.warningList();

        return chatClient.prompt()
                .user("""
                        请根据下�?ERP 数据生成库存风险和补货建议�?
                        Dashboard:
                        %s

                        Low stock products:
                        %s
                        """.formatted(dashboard, warnings))
                .call()
                .content();
    }
}
```

### Task 14: Add AI Controller

**Purpose:** Expose AI assistant to frontend through authenticated API.

**Files:**
- Create: `server/src/main/java/com/asterflow/erp/controller/AiAssistantController.java`
- Modify: frontend API proxy later.

**Acceptance Criteria:**
- [ ] Endpoint is protected by existing JWT interceptor.
- [ ] Endpoint returns `ApiResponse`.
- [ ] No admin-only operation is exposed in v1.

**Suggested Controller Code:**

```java
@RestController
@RequestMapping("/api/ai")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    public AiAssistantController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    @GetMapping("/inventory-advice")
    public ApiResponse<String> inventoryAdvice() {
        return ApiResponse.success(aiAssistantService.inventoryAdvice());
    }
}
```

### Task 15: Add Frontend AI Page

**Purpose:** Display AI advice without interrupting normal ERP workflows.

**Files:**
- Create: `client/src/pages/ai-assistant.tsx`
- Create: `client/src/pages/api/ai/inventory-advice.ts`
- Modify: `client/src/components/Layout.tsx` navigation.

**Acceptance Criteria:**
- [ ] Page has a button to request AI advice.
- [ ] Loading, error, and result states are clear.
- [ ] API proxy forwards Authorization header.
- [ ] Failure does not break Dashboard or inventory pages.

---

## Phase 5: Spring AI Tool Calling and Structured Output

### Task 16: Introduce Tools Carefully

**Purpose:** Let AI call read-only ERP tools instead of dumping all data into prompts.

**Files:**
- Create: `server/src/main/java/com/asterflow/erp/ai/InventoryAiTools.java`
- Modify: `AiAssistantServiceImpl`

**Acceptance Criteria:**
- [ ] Tools are read-only.
- [ ] Tools call services, not mappers.
- [ ] No write operation is available as a tool.

**Suggested Tool Code:**

```java
public class InventoryAiTools {

    private final ProductService productService;
    private final DashboardService dashboardService;

    public InventoryAiTools(ProductService productService, DashboardService dashboardService) {
        this.productService = productService;
        this.dashboardService = dashboardService;
    }

    @Tool(description = "查询当前低库存商品列�?)
    public List<ProductResponse> lowStockProducts() {
        return productService.warningList();
    }

    @Tool(description = "查询当前 ERP Dashboard 汇总数�?)
    public DashboardSummaryResponse dashboardSummary() {
        return dashboardService.summary();
    }
}
```

### Task 17: Switch AI Output From String to DTO

**Purpose:** Make AI output easier to render and test.

**Files:**
- Modify: `AiAssistantService`
- Modify: `AiAssistantServiceImpl`
- Modify: `AiAssistantController`
- Modify frontend AI page.

**Acceptance Criteria:**
- [ ] Backend returns `AiInventoryAdviceResponse`.
- [ ] Frontend renders summary, risks, suggestions, actions separately.
- [ ] If structured output fails, error is visible and does not corrupt normal ERP data.

---

## Verification Checkpoints

### Checkpoint A: Before Spring AI

- [ ] `npm --workspace client run lint`
- [ ] `npm run build:client`
- [ ] `cd server && .\mvnw.cmd -B clean verify`
- [ ] Login -> product -> purchase -> approve -> sale -> approve -> stock records works manually.

### Checkpoint B: Before Redis Hardening

- [ ] Local mode works without Redis.
- [ ] Redis mode works with Redis running.
- [ ] Logout invalidates session.
- [ ] Dashboard still works if cache is empty.

### Checkpoint C: Before AI UI

- [ ] Backend starts with `OPENAI_API_KEY`.
- [ ] `/api/ai/inventory-advice` requires login.
- [ ] AI endpoint reads existing ERP services only.
- [ ] AI failure does not break non-AI endpoints.

---

## Recommended Build Order

1. Frontend page completeness.
2. Backend validation and pagination hardening.
3. Inventory concurrency hardening.
4. Redis session/cache/idempotency/rate limit.
5. Spring AI read-only string response.
6. Spring AI frontend page.
7. Spring AI tools and structured output.

This order keeps the project understandable: first prove the ERP works, then prove it is reliable, then add AI as a polished extension.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| AI output fabricates business data | High | Prompts say "only use provided data"; v1 returns suggestions only, no writes |
| Redis unavailable blocks local development | Medium | Keep local fallback modes and clear env flags |
| Overselling under concurrent requests | High | Use DB transaction plus conditional stock update |
| Duplicate approve/cancel requests | Medium | Add idempotency key and status conditional update |
| Frontend grows by copy-paste | Medium | Create shared components after the third repeated pattern |
| Too many features at once | High | Follow task order and verify every 2-3 tasks |

## Notes For Learning

- Controller is the HTTP entrance. It should parse request and return response.
- Service is where business rules live. Inventory, status transitions, and audit logs belong here.
- Mapper is database access. Controllers and AI should not call mappers.
- DTO is data exchanged with frontend. It avoids exposing database entity details.
- Redis is fast temporary storage. MySQL is durable business storage.
- Spring AI `ChatClient` is the object used to ask the AI model questions.
- Tool Calling means AI can choose from Java methods you expose. In this project, expose only read-only tools first.
