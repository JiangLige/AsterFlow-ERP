# 任务清单：AsterFlow ERP 工程卫生与面试展示完善

## 状态

IMPLEMENT 已完成。任务 1 到任务 8 均已完成，最终前端构建和后端 `clean verify` 已通过。

## 执行原则

- 每次只做一个任务，完成后运行对应验证。
- 不回滚用户已有改动。
- 不改数据库表结构。
- 不新增生产依赖。
- 不把真实密钥写进仓库。
- 优先保证后端 `clean verify` 和前端 `build` 仍然通过。

## 阶段 1：基线与范围确认

### 任务 1：记录当前工作区和改动范围

**说明：**  
在开始实现前，确认当前分支、已有未提交改动、构建产物状态和本轮预计改动文件。这个任务的价值是避免误删或覆盖用户已有工作。

**验收标准：**

- [ ] 已记录 `git status --short --branch` 的输出。
- [ ] 已区分“本轮计划新增/修改文件”和“已有未提交文件”。
- [ ] 已确认 `server/target`、`client/.next`、`node_modules` 不会进入提交范围。

**验证：**

- [ ] 运行：`git status --short --branch`
- [ ] 人工确认：没有使用 `git reset`、`git checkout --` 等破坏性命令。

**依赖：** 无

**预计涉及文件：**

- 不改源文件，只记录状态。

**预计范围：** XS

## 检查点 A：基线清楚

- [ ] 工作区状态已理解。
- [ ] 本轮不会覆盖已有用户改动。
- [ ] 可以进入结构迁移。

## 阶段 2：Java 包结构和配置清理

### 任务 2：迁移 `entity` 包到 `com.asterflow.erp.entity`

**说明：**  
把顶层 `entity` 包迁移到标准应用包下，并更新所有引用。这个任务是机械性跨文件迁移，预计会超过 5 个文件；不建议拆成多个半迁移任务，因为中间状态会导致项目无法编译。

**验收标准：**

- [ ] 所有实体类的包名从 `entity` 变为 `com.asterflow.erp.entity`。
- [ ] 后端源码和测试中不再存在 `import entity.`。
- [ ] `entity.MybatisPlusConfig` 被移除或不再作为有效配置类存在。
- [ ] 保留 `com.asterflow.erp.config.MybatisPlusConfig` 作为唯一有效 MyBatis-Plus 配置。
- [ ] 不修改表名、字段名、SQL 初始化脚本和 API 路径。

**验证：**

- [ ] 运行：`rg -n "import entity\\.|package entity;" server/src/main/java server/src/test/java`
- [ ] 运行：`cd server; .\mvnw.cmd test`

**依赖：** 任务 1

**预计涉及文件：**

- `server/src/main/java/entity/*.java`
- `server/src/main/java/com/asterflow/erp/mapper/*.java`
- `server/src/main/java/com/asterflow/erp/service/**/*.java`
- `server/src/main/java/com/asterflow/erp/controller/*.java`
- `server/src/test/java/com/asterflow/erp/**/*.java`

**预计范围：** L，机械性例外

## 检查点 B：后端结构迁移可编译

- [ ] `entity` 顶层包已清理。
- [ ] 后端测试通过：`cd server; .\mvnw.cmd test`
- [ ] 没有数据库结构变更。

## 阶段 3：API 安全边界测试

### 任务 3：新增 API 安全集成测试

**说明：**  
新增一个聚焦的安全集成测试类，沿用现有 `@SpringBootTest(webEnvironment = RANDOM_PORT)` 和 Java `HttpClient` 风格，证明后端安全边界不是只靠前端按钮隐藏。

**验收标准：**

- [ ] 缺少 JWT 访问受保护接口返回 `401`。
- [ ] `staff / user123` 访问管理员操作返回 `403`。
- [ ] 非法请求体返回 `VALIDATION_ERROR`。
- [ ] 测试复用现有登录和响应解析风格，不引入新的测试框架。

**验证：**

- [ ] 运行：`cd server; .\mvnw.cmd -Dtest=AuthSessionIntegrationTest,*Security* test`

**依赖：** 任务 2

**预计涉及文件：**

- `server/src/test/java/com/asterflow/erp/controller/ApiSecurityIntegrationTest.java`
- 如需复用帮助方法，可小幅调整现有测试工具或测试类。

**预计范围：** M

### 任务 4：修复安全测试暴露的后端缺口

**说明：**  
如果任务 3 的测试暴露出真实缺口，只做最小范围修复，例如管理员校验、参数校验或统一错误响应。不借机重构认证体系。

**验收标准：**

- [ ] 任务 3 的安全测试全部通过。
- [ ] 未改变登录、刷新、退出和普通查询接口的现有行为。
- [ ] 管理员权限仍由后端强制校验，而不是只靠前端角色判断。

**验证：**

- [ ] 运行：`cd server; .\mvnw.cmd -Dtest=AuthSessionIntegrationTest,*Security* test`
- [ ] 如修改公共异常或拦截器，运行：`cd server; .\mvnw.cmd test`

**依赖：** 任务 3

**预计涉及文件：**

- `server/src/main/java/com/asterflow/erp/util/AuthUtil.java`
- `server/src/main/java/com/asterflow/erp/interceptor/JwtInterceptor.java`
- 相关 Controller 或 Service，按失败测试最小定位。

**预计范围：** S 到 M，视测试结果而定

## 检查点 C：安全边界已被测试证明

- [ ] 缺 JWT、员工越权、非法参数三个场景有自动化测试。
- [ ] 相关测试通过。
- [ ] 后端整体测试至少跑过一次。

## 阶段 4：源码文案和展示细节清理

### 任务 5：修复源码中的乱码、截断文案和 Swagger 描述

**说明：**  
修正用户可见或面试可见的源码文案，包括认证错误、AI 提示词、AI 兜底文案和 OpenAPI 描述。只修文案，不改变业务逻辑。

**验收标准：**

- [ ] `JwtInterceptor`、`UserServiceImpl` 中“请重新登”等截断文案已修正。
- [ ] AI prompt 和 fallback 文案中不再出现 `真?ERP`、`当?ERP` 等乱码。
- [ ] Swagger/OpenAPI 描述中不再出现明显乱码。
- [ ] 文案仍保持简洁中文，不引入英文混杂解释。

**验证：**

- [ ] 运行：`rg -n "真\\?|当\\?|重新登|结构\\?AI|锛|鐨|涓" server/src/main/java`
- [ ] 运行：`cd server; .\mvnw.cmd test`

**依赖：** 任务 2

**预计涉及文件：**

- `server/src/main/java/com/asterflow/erp/interceptor/JwtInterceptor.java`
- `server/src/main/java/com/asterflow/erp/service/impl/UserServiceImpl.java`
- `server/src/main/java/com/asterflow/erp/service/impl/AiAssistantServiceImpl.java`
- `server/src/main/java/com/asterflow/erp/controller/AiAssistantController.java`

**预计范围：** M

### 任务 6：修复 `.env.example` 和面试文档的乱码/过时描述

**说明：**  
清理配置示例和面试相关文档中的乱码，并把 Spring AI、Redis 的现状描述改成与当前代码一致。重点是让面试官和开发者读到的信息可信。

**验收标准：**

- [ ] `.env.example` 中 local / Redis / 限流说明是可读中文。
- [ ] 文档不再声称“Spring AI 未接入”，除非上下文明确指的是旧状态。
- [ ] 文档不夸大未实现能力，例如布隆过滤器、完整缓存穿透防护、真实 Redis 集成测试。
- [ ] 不把路线图重写成营销文案，只修乱码和不准确内容。

**验证：**

- [ ] 运行：`rg -n "锛|涓|鐨|未接入|布隆过滤器" .env.example docs`
- [ ] 人工确认：保留下来的“未接入/布隆过滤器”只出现在明确的后续计划语境中。

**依赖：** 任务 5 可并行或之后

**预计涉及文件：**

- `.env.example`
- `docs/PROJECT_ROADMAP.md`
- `docs/INTERVIEW_UPGRADE_PLAN.md`
- 必要时更新本 spec/plan/tasks 状态。

**预计范围：** M

## 检查点 D：展示文本可信

- [ ] 源码核心文案无明显乱码。
- [ ] 配置示例可读。
- [ ] 文档描述与当前实现一致。

## 阶段 5：AI / Redis 行为对齐和轻量验证

### 任务 7：补齐 AI / Redis 当前能力的轻量验证或说明

**说明：**  
确认 Spring AI 失败时有结构化兜底，Redis 相关能力不会成为本地和 CI 的强依赖。能用现有单元测试覆盖的就补测试；需要真实 Redis 的内容只写清楚边界，不在本轮引入外部依赖。

**验收标准：**

- [ ] AI 兜底逻辑在模型调用失败时仍返回有效 `AiInventoryAdviceResponse`。
- [ ] Redis 相关文档明确说明当前是可选模式。
- [ ] 不新增 Docker、Redis 容器或生产依赖。
- [ ] 测试不要求本地启动 Redis 或配置真实 OpenAI API Key。

**验证：**

- [ ] 运行：`cd server; .\mvnw.cmd -Dtest=InventoryAiToolsTest,AiResponseDtoTest,RateLimitInterceptorTest test`
- [ ] 如新增 AI fallback 测试，运行对应测试类。

**依赖：** 任务 5、任务 6

**预计涉及文件：**

- `server/src/test/java/com/asterflow/erp/ai/InventoryAiToolsTest.java`
- `server/src/test/java/com/asterflow/erp/dto/ai/AiResponseDtoTest.java`
- `docs/INTERVIEW_UPGRADE_PLAN.md`
- `docs/PROJECT_ROADMAP.md`

**预计范围：** S 到 M

## 检查点 E：加分项边界清晰

- [ ] Spring AI 不依赖真实 Key 才能通过测试。
- [ ] Redis 说明是可选能力，不伪装成完整生产高可用方案。
- [ ] 相关测试通过。

## 阶段 6：最终验证和交付说明

### 任务 8：运行完整验证并整理最终状态

**说明：**  
完成所有代码和文档改动后，跑完整验证，确认没有构建产物进入变更范围，并更新规格文档状态。

**验收标准：**

- [ ] 前端生产构建通过。
- [ ] 后端 `clean verify` 通过。
- [ ] Git 状态只包含本轮有意修改的源码、测试、文档文件。
- [ ] spec / plan / tasks 的状态已反映实际完成情况。
- [ ] 最终总结能说明做了什么、验证了什么、仍有哪些风险。

**验证：**

- [ ] 运行：`npm run build:client`
- [ ] 运行：`cd server; .\mvnw.cmd -B clean verify`
- [ ] 运行：`git status --short --branch`

**依赖：** 任务 1 到任务 7

**预计涉及文件：**

- `docs/specs/2026-07-08-project-hardening-spec.md`
- `docs/specs/2026-07-08-project-hardening-plan.md`
- `docs/specs/2026-07-08-project-hardening-tasks.md`

**预计范围：** S

## 最终完成定义

- [ ] 所有任务的验收标准都满足，或有明确说明为什么跳过。
- [ ] 所有检查点都通过。
- [ ] `npm run build:client` 通过。
- [ ] `cd server; .\mvnw.cmd -B clean verify` 通过。
- [ ] 没有提交真实密钥。
- [ ] 没有无意修改构建产物或依赖目录。
- [ ] 文档和实现不互相矛盾。

## 待确认问题

1. 员工越权测试代表接口建议用“商品删除”，因为它是典型管理员动作；如果你更想展示供应商启停用或订单删除，也可以改。
2. 文档清理建议同时修乱码和过时描述，不只修乱码；否则面试官会看到“Spring AI 未接入”和当前代码冲突。
3. `entity` 包迁移建议作为一个机械性大任务做完再验证，不拆成半迁移。
4. 任务清单确认后，下一阶段是 IMPLEMENT，按任务 1 到任务 8 顺序执行。
