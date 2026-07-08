# Spec: AsterFlow ERP 工程卫生与面试展示完善

## Review Status

IMPLEMENT completed on 2026-07-08. The spec moved through PLAN and TASKS review, and final frontend/backend verification passed.

## Assumptions

1. 目标项目是当前仓库：`C:\Users\EDY\Desktop\AsterFlow ERP`。
2. 本轮目标不是新增大业务模块，而是提升项目的工程一致性、面试展示质量和自动化验证可信度。
3. 现有业务功能、接口路径、数据库表结构原则上保持兼容。
4. Spring AI、Redis、JWT、库存事务等现有能力只做修补和验证，不在本轮重构为全新架构。
5. 所有实现改动都应先通过后端测试和前端构建验证，再视情况补充文档。

If any assumption is wrong, revise this spec before implementation.

## Objective

把 AsterFlow ERP 从“功能可演示”提升到“面试展示更稳、工程结构更干净、验证链路更可信”的状态。

Primary users:

- 面试官：希望快速看懂项目亮点、业务闭环和工程质量。
- 开发者本人：需要能稳定运行、讲清楚设计取舍，并用测试证明关键行为。
- 后续维护者：希望包结构、配置、文档和测试入口清晰一致。

The work focuses on five outcomes:

- 消除明显的乱码、截断文案和展示瑕疵。
- 清理 Java 包结构中的历史遗留，例如顶层 `entity` 包和重复配置类。
- 补齐 Controller/API 安全边界测试，证明 JWT、角色、校验和错误响应有效。
- 让 Spring AI、Redis、限流等“加分项”的现状与文档一致，不夸大、不误导。
- 保持现有前端构建、后端测试和业务闭环全部通过。

## Tech Stack

- Frontend: Next.js 14, React 18, TypeScript
- Backend: Java 21, Spring Boot 4.0.5, MyBatis-Plus 3.5.15
- Database: MySQL 8 for local/prod, H2 for automated tests
- Cache/session optional modes: local memory or Redis via Spring Data Redis
- AI: Spring AI 2.0.0 with OpenAI chat model configuration
- Auth: JWT access tokens plus local/Redis-backed session store
- API documentation: springdoc-openapi / Swagger UI
- CI: GitHub Actions with Node 20 and Temurin Java 21

## Commands

Run from repository root unless noted.

Install dependencies:

```powershell
npm install
```

Run full local development:

```powershell
npm run dev
```

Run frontend only:

```powershell
npm run dev:client
```

Run backend only:

```powershell
npm run dev:server
```

Build frontend:

```powershell
npm run build:client
```

Run all backend tests and package backend:

```powershell
cd server
.\mvnw.cmd -B clean verify
```

Run all backend tests without packaging:

```powershell
cd server
.\mvnw.cmd test
```

Run targeted backend tests:

```powershell
cd server
.\mvnw.cmd -Dtest=SaleOrderServiceIntegrationTest test
.\mvnw.cmd -Dtest=PurchaseOrderServiceIntegrationTest test
.\mvnw.cmd -Dtest=AuthSessionIntegrationTest test
```

Build backend via root script:

```powershell
npm run build:server
```

Check git state:

```powershell
git status --short --branch
```

## Project Structure

```text
client/
  src/pages/             Next.js pages and API proxy routes
  src/components/        Shared UI components
  src/lib/               Frontend API/auth helpers
  src/styles/            Global frontend styles

server/
  pom.xml                Backend dependencies and Spring Boot build
  src/main/java/
    com/asterflow/erp/   Backend application code
      ai/                AI tool definitions
      common/            ApiResponse, ErrorCode, common exceptions
      config/            Spring, MyBatis, OpenAPI, web configuration
      controller/        HTTP API entry points
      dto/               Request and response DTOs
      enums/             Domain enums
      exception/         Global exception handling
      interceptor/       JWT and rate-limit interceptors
      mapper/            MyBatis-Plus mappers
      service/           Business service interfaces and implementations
      util/              Shared backend utilities
    entity/              Current legacy entity package to be migrated
  src/main/resources/
    application.yml      Runtime configuration
    db/init.sql          MySQL schema and seed data
  src/test/java/         Backend unit and integration tests
  src/test/resources/    H2 schema, data, and test application config

docs/
  specs/                 Living specs for larger changes
  ARCHITECTURE.md        Architecture overview
  TESTING_GUIDE.md       Testing notes and commands
  PROJECT_ROADMAP.md     Roadmap, to be cleaned if kept
  INTERVIEW_UPGRADE_PLAN.md Interview-oriented improvement notes

.github/workflows/
  ci.yml                 Frontend build and backend verify workflow
```

Target structure change:

- Move `server/src/main/java/entity/*` into `server/src/main/java/com/asterflow/erp/entity/*`.
- Remove the duplicate `entity.MybatisPlusConfig`.
- Update imports and MyBatis mappings without changing table names or API contracts.

## Code Style

Backend conventions:

- Controllers delegate business rules to services.
- Services own transaction boundaries and domain validation.
- DTOs use Bean Validation for request validation.
- Business failures throw `BusinessException` with an `ErrorCode`.
- Avoid hard-coded secrets and avoid exposing internal exception messages to API responses.
- User-facing Chinese text must be valid UTF-8 and not truncated.

Example backend style:

```java
@Transactional
public void requireAdminAndDeleteProduct(Long id, HttpServletRequest request) {
    authUtil.requireAdmin(request);

    Product product = productMapper.selectById(id);
    if (product == null) {
        throw new BusinessException(ErrorCode.BUSINESS_ERROR, "商品不存在");
    }

    productMapper.deleteById(id);
}
```

Frontend conventions:

- Page components call `apiRequest` instead of duplicating token logic.
- Admin-only UI controls may be hidden in the frontend, but backend authorization remains mandatory.
- Form validation should show concise Chinese error messages.
- Shared visual or data-fetching logic should go under `client/src/components` or `client/src/lib` only when it reduces duplication.

Example frontend style:

```tsx
const response = await apiRequest('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(form),
});

if (!response.ok) {
  setError('保存失败，请检查输入内容');
  return;
}
```

## Testing Strategy

Required verification before this work can be called complete:

- Frontend production build passes with `npm run build:client`.
- Backend clean verification passes with `cd server; .\mvnw.cmd -B clean verify`.
- Existing service integration tests for purchase, sale, stock adjustment, auth session, OpenAPI, and AI DTO/tool behavior remain green.
- New or updated tests cover the changed behavior.

Test levels:

- Unit tests for pure utilities, error-code behavior, DTO response helpers, and small service helpers.
- Service integration tests for transaction-sensitive business flows.
- Controller/API tests for JWT rejection, role checks, validation errors, and stable response shapes.
- Build verification for frontend route/type regressions.

Expected new test coverage:

- Protected endpoints reject missing or invalid JWT.
- Admin-only delete or status-change endpoints reject staff users.
- Invalid request bodies return `VALIDATION_ERROR`.
- List endpoints enforce pagination bounds and status enum validation.
- AI fallback behavior returns valid structured data when model calls fail.
- Redis optional modes degrade gracefully where the implementation promises fallback.

## Boundaries

Always do:

- Preserve existing business behavior unless this spec explicitly changes it.
- Run backend tests after backend changes.
- Run frontend build after frontend or API proxy changes.
- Keep user-facing Chinese text UTF-8 and readable.
- Keep secrets in environment variables or examples, not committed real values.
- Update docs when a visible capability or command changes.
- Keep changes small enough to review by topic.

Ask first:

- Database table or column changes.
- Adding new production dependencies.
- Changing CI triggers or required GitHub Actions jobs.
- Replacing JWT/session strategy.
- Replacing MyBatis-Plus or major Spring Boot configuration.
- Removing existing features or pages.
- Making AI write to business data.

Never do:

- Commit real API keys, passwords, tokens, or private hostnames.
- Remove failing tests to make CI pass.
- Hide backend authorization behind frontend-only checks.
- Edit `node_modules`, `.next`, `target`, or Maven cache directories.
- Reformat unrelated files purely for style.
- Rewrite the whole project when a scoped migration is enough.

## Success Criteria

The project is considered done for this spec when all of these are true:

1. No obvious mojibake or truncated Chinese appears in touched source files, `.env.example`, README-visible docs, Swagger descriptions, or core API error messages.
2. Entity classes live under `com.asterflow.erp.entity`, and imports no longer depend on top-level `entity`.
3. Only one effective MyBatis-Plus configuration class remains in the application source.
4. Existing business endpoints and frontend routes still compile and build.
5. `npm run build:client` passes.
6. `cd server; .\mvnw.cmd -B clean verify` passes.
7. At least one controller/API test proves protected endpoints reject missing JWT.
8. At least one controller/API test proves staff users cannot perform an admin-only action.
9. At least one validation test proves malformed request input returns `VALIDATION_ERROR`.
10. Documentation accurately describes current Spring AI and Redis behavior without claiming unimplemented features.
11. `.env.example` explains local versus Redis modes in readable UTF-8 text.
12. Git status after implementation contains only intentional source/doc changes and no build artifacts.

## Out of Scope

- Building a full production deployment pipeline.
- Adding Docker Compose unless explicitly approved later.
- Implementing Bloom filter or advanced Redis cache penetration protection in this spec.
- Adding a new database migration framework.
- Redesigning the frontend UI.
- Replacing the auth model.
- Rewriting Spring AI as an autonomous agent with write tools.

## Open Questions

1. Should the entity package migration be done now, or kept as a separate follow-up to reduce risk?
2. Should docs remain mostly Chinese, or should README and testing docs become bilingual for interview presentation?
3. Should API security tests use `TestRestTemplate` integration style or `MockMvc` slice style?
4. Should Redis-mode tests require a real Redis instance, or should this spec only test graceful fallback/unit behavior?
5. Should Spring AI be default-enabled for demos, or remain configured but safe to fail without an API key?

## Review Prompt

Please review this spec before implementation. If approved, the next phase is PLAN: dependency order, risks, and verification checkpoints.
