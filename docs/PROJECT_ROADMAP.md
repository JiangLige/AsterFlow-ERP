# AsterFlow ERP 项目完善路线

这份路线按“业务闭环 -> 工程质量 -> Redis 可靠性 -> Spring AI 展示”的顺序推进。当前项目已经具备可演示的进销存主流程，下一步重点是让代码结构、自动化验证和面试讲法保持一致。

## 0. 当前状态

后端使用 Spring Boot 4.0.5、Java 21、MyBatis-Plus、MySQL、Redis 和 Spring AI；前端使用 Next.js 与 React。核心后端代码位于 `server/src/main/java/com/asterflow/erp`。

已经具备的能力：

- 商品、供应商、客户、采购、销售、库存流水和审计日志等核心业务模块。
- 采购审核入库、采购取消反向出库、销售审核扣库存、销售取消回补库存。
- JWT 登录、刷新令牌、会话存储和管理员权限校验。
- 统一响应、全局异常、参数校验、Swagger/OpenAPI 文档。
- Dashboard 汇总缓存支持 `local` 和 `redis` 两种模式。
- 商品详情缓存和不存在商品的短 TTL 空值缓存支持 `local` 和 `redis` 两种模式。
- 商品布隆过滤器支持 `local` 和 `redis` 两种模式，启动时预热已有商品 ID。
- 幂等提交支持 `local` 和 `redis` 两种模式。
- Redis 限流拦截器支持按配置开启，默认本地开发关闭。
- Spring AI 已接入 OpenAI ChatClient，提供只读库存分析工具和结构化兜底结果。

仍需谨慎说明的边界：

- Redis 是可选增强，不是本地开发和测试的强依赖。
- 热点 Key 互斥重建等仍属于后续增强。
- Spring AI 需要有效 `OPENAI_API_KEY` 才能调用真实模型；模型失败时后端返回基于当前 ERP 数据的兜底建议。
- AI 库存建议页面已有基础版本，更完整的交互和面试问答仍可继续完善。

## 1. 本地启动顺序

先初始化 MySQL：

```bash
mysql -uroot -proot < server/src/main/resources/db/init.sql
```

如果本机密码不是 `root`，改成自己的密码。默认账号：

- 管理员：`admin / admin123`
- 普通员工：`staff / user123`

确认 `.env.example` 或本地环境变量中的连接信息：

```text
DB_URL=jdbc:mysql://localhost:3306/asterflow_erp?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8
DB_USERNAME=root
DB_PASSWORD=root
ERP_AUTH_SESSION_STORE=local
ERP_CACHE_TYPE=local
ERP_IDEMPOTENCY_STORE=local
ERP_RATE_LIMIT_ENABLED=false
```

本地开发建议先使用 `local` 模式，等主流程跑通后再切换 Redis。

## 2. 第一阶段：业务闭环

目标：采购、销售、库存三条主线没有明显半成品痕迹。

已完成或已经具备：

- 采购和销售审核都在事务内更新订单状态、商品库存和库存流水。
- 取消已审核单据会生成反向库存流水。
- 销售扣库存使用库存不足校验，避免库存被扣成负数。
- 订单状态更新带条件判断，能降低重复操作和并发覆盖风险。

后续可继续增强：

- 给商品删除增加业务占用检查，有订单或流水时只允许停用。
- 给库存流水补充操作人字段，进一步提升审计可追溯性。
- 统一更多业务错误码，方便前端和面试讲解。

面试讲法：

> 我把库存变化设计成单据驱动：采购审核入库、销售审核出库，取消单据时生成反向库存流水，并用事务保证订单状态、商品库存和流水记录一致。

## 3. 第二阶段：工程质量

目标：从“能跑”提升到“可以解释、可以验证、可以维护”。

当前已经补强：

- 实体类归入 `com.asterflow.erp.entity`，避免顶层 `entity` 包破坏项目结构。
- 保留唯一有效的 `com.asterflow.erp.config.MybatisPlusConfig`。
- 新增安全集成测试，覆盖缺少 JWT、员工越权和非法请求体。
- 源码和 Swagger 文案中的乱码、截断描述已经清理。

建议继续补：

- 对分页参数统一限制，例如 `page >= 1`、`size <= 100`。
- 对状态字段使用枚举校验，减少前端乱传字符串。
- 对高风险 Service 保持集成测试覆盖，例如库存不足回滚、取消后库存回补、非草稿单据不能修改或删除。

## 4. 第三阶段：前端演示

目标：面试时能从页面完整演示流程。

建议演示路径：

```text
登录 -> 查看 Dashboard -> 查看库存预警 -> 新建采购单 -> 审核采购入库 -> 新建销售单 -> 审核销售出库 -> 查看库存流水和 Dashboard 变化
```

页面优先级：

1. 登录页和首页 Dashboard。
2. 商品列表、新增、编辑、库存预警和库存调整。
3. 供应商、客户列表。
4. 采购单列表、新增、审核、取消。
5. 销售单列表、新增、审核、取消。
6. 库存流水列表，可按商品、类型、时间筛选。
7. AI 库存建议页面。

## 5. 第四阶段：Spring AI 展示

Spring AI 现在已经不是单纯路线图：后端已接入 Spring AI 2.0.0 BOM、`spring-ai-starter-model-openai`、`ChatClient`、只读工具和结构化响应 DTO。

当前实现重点：

- `InventoryAiTools` 只读调用现有业务服务，不直接访问 Mapper，也不写数据库。
- `/api/ai/inventory-advice` 通过 `AiAssistantService` 返回结构化库存建议。
- Prompt 明确要求只根据系统提供的 ERP 数据回答。
- AI 调用失败时返回兜底 `AiInventoryAdviceResponse`，不会影响非 AI 主流程。

后续可升级：

- 打磨 AI 建议页面的加载态、空态和错误态。
- 引入更多只读 Tool Calling，例如销售统计、采购统计、客户风险提示。
- 使用结构化输出继续稳定前端渲染。
- 如需会话记忆或 RAG，应先明确数据边界和权限边界。

面试讲法：

> 我没有让 AI 绕过业务系统直接操作数据库，而是把它设计成只读分析助手。AI 通过已有 Service 和只读工具获取 Dashboard、库存预警等数据，生成经营摘要和补货建议；模型不可用时也会返回基于 ERP 数据的兜底建议。

## 6. Redis 展示边界

当前 Redis 能力：

- `ERP_CACHE_TYPE=redis` 时，Dashboard 汇总缓存写入 Redis。
- `ERP_AUTH_SESSION_STORE=redis` 时，登录会话存入 Redis。
- `ERP_IDEMPOTENCY_STORE=redis` 时，提交幂等 Key 存入 Redis。
- `ERP_RATE_LIMIT_ENABLED=true` 时，限流拦截器使用 Redis Lua 脚本原子计数。

默认本地配置仍然使用 local 模式，避免没有 Redis 时启动和测试受阻。

后续增强方向：

- 热点 Key 互斥重建或逻辑过期。
- Redis 不可用时的更多降级测试和监控告警。

面试讲法：

> Redis 在这个项目里是加速层和协调层，不是业务数据源。MySQL 事务仍然负责订单和库存正确性；Redis 用于缓存、会话、幂等和限流，且本地开发可以切回 local 模式。

## 7. 推荐推进节奏

1. 先保证后端 `mvnw test` 和前端构建稳定。
2. 完成前端主流程演示页面。
3. 补齐关键接口测试和面试问答。
4. 打磨 AI 前端页面，把 `/api/ai/inventory-advice` 的结果讲得更清楚。
5. 再做 Redis 深水区能力：热点 Key、降级验证和真实 Redis 集成验证。
