# AsterFlow ERP 面试升级方案

## 1. 当前完成度

结论：项目已经从“普通 CRUD ERP”升级到“可演示业务闭环 + 工程质量补强 + Redis 可选增强 + Spring AI 加分项”的状态。它仍不是完整生产级 ERP，但已经具备较好的面试展示基础。

已完成部分：

- 后端核心业务：商品、供应商、客户、采购、销售、库存流水、审计日志。
- 事务闭环：采购审核入库、采购取消反向出库、销售审核出库、销售取消回补库存。
- 权限认证：JWT 登录、刷新令牌、角色识别、管理员操作校验。
- 工程质量：统一响应、全局异常、参数校验、Swagger/OpenAPI、后端自动化测试。
- Redis：Dashboard 缓存、商品详情缓存、空值缓存、认证会话、幂等提交和限流都有可选 Redis 实现。
- Spring AI：已接入 Spring AI 2.0.0、OpenAI ChatClient、只读工具调用和结构化库存建议响应。

仍未完成或不能夸大的部分：

- 布隆过滤器尚未实现。
- 热点 Key 互斥重建、缓存雪崩治理仍是后续优化。
- Redis 模式还缺少真实 Redis 环境下的集成验证。
- AI 前端展示页已有基础版本，可以继续完善交互细节。
- 项目还需要更系统的面试问答和部署说明。

## 2. 项目定位

建议面试定位：

> AsterFlow ERP 是一个面向中小企业进销存场景的 Spring Boot + Next.js 系统，核心强调库存一致性、业务可追溯、权限审计、Redis 可选增强和 Spring AI 智能经营分析。

不要只讲“我做了增删改查”。更好的讲法是围绕这些点展开：

- 业务闭环：采购、销售、库存联动。
- 数据一致性：事务、条件更新、库存流水。
- 安全边界：JWT、角色校验、后端权限控制、非法参数校验。
- 性能和可靠性：Redis 缓存、会话、幂等、限流都支持可选开启。
- 智能化：Spring AI 只读分析 ERP 数据，模型失败时有兜底结果。

## 3. Spring AI 接入状态

当前状态：已接入后端最小闭环。

已经具备：

- `server/pom.xml` 使用 Spring AI BOM `2.0.0`。
- 已加入 `spring-ai-starter-model-openai`。
- `application.yml` 通过 `OPENAI_API_KEY` 和 `OPENAI_CHAT_MODEL` 读取配置。
- `AiAssistantController` 暴露 `/api/ai/inventory-advice`。
- `AiAssistantServiceImpl` 使用 `ChatClient` 和 `InventoryAiTools`。
- `InventoryAiTools` 只读调用 `ProductService`、`DashboardService` 等业务服务。
- AI 失败时返回结构化兜底 `AiInventoryAdviceResponse`。

当前边界：

- 没有真实 `OPENAI_API_KEY` 时，不应把 AI 失败当成系统主流程失败。
- AI 不直接调用 Mapper，不绕过 Service，不写库存和订单。
- 目前优先展示库存风险和补货建议，不要宣传成完整智能决策系统。

面试讲法：

> 我的 AI 接入不是让模型直接改数据库，而是把它放在业务系统外层做只读分析。模型通过 Spring AI Tool Calling 读取库存预警和 Dashboard 数据，输出结构化建议；如果模型调用失败，系统仍会基于现有 ERP 数据返回兜底建议，不影响采购、销售、库存这些主流程。

## 4. Redis 接入状态

当前状态：Redis 是可选增强，默认本地开发仍使用 local 模式。

已经具备：

- `ERP_CACHE_TYPE=local|redis` 控制 Dashboard 缓存实现。
- 商品详情缓存和不存在商品的短 TTL 空值缓存同样支持 `local|redis`。
- `ERP_AUTH_SESSION_STORE=local|redis` 控制登录会话存储。
- `ERP_IDEMPOTENCY_STORE=local|redis` 控制幂等 Key 存储。
- `ERP_RATE_LIMIT_ENABLED=true` 时启用 Redis 限流拦截器。
- Redis Dashboard 缓存读写失败会记录日志并降级，不阻断主流程。
- Redis 限流异常时默认放行请求，避免 Redis 故障拖垮业务接口。

仍未完成：

- 布隆过滤器。
- 热点 Key 互斥重建。
- Redis 集群、高可用和真实压测。

面试讲法：

> Redis 在这个项目里不是业务数据源，而是缓存和协调组件。MySQL 负责订单、库存和流水的最终一致性；Redis 用于 Dashboard 缓存、商品详情缓存、空值缓存、登录会话、幂等提交和限流。为了方便本地开发，我保留了 local 模式，生产环境再按配置切换到 Redis。

## 5. 高频问题讲法

事务一致性：

- 采购审核、销售审核、库存流水必须在同一个事务里。
- 任意一步失败都要回滚，避免订单状态和库存不一致。

库存超卖：

- 不能只靠“先查库存再更新”。
- 销售审核需要在 Service 层校验库存，并通过条件更新或事务控制降低并发风险。
- 更新失败或库存不足要返回清晰业务错误。

权限控制：

- 前端隐藏按钮不是安全边界。
- 后端通过 JWT 解析用户身份和角色，并在管理员操作上强制校验。
- 缺少 Token、员工越权、非法请求体都有自动化测试覆盖。

缓存一致性：

- 写 MySQL 后删除缓存。
- 读请求未命中时重新查数据库并回写缓存。
- Redis 失败不能阻断核心库存和订单流程。

AI 安全边界：

- AI 只读，不写数据库。
- Prompt 要求只使用系统提供的数据。
- Tool Calling 暴露的也只能是只读业务能力。
- 模型不可用时返回兜底建议。

## 6. 后续开发优先级

第一优先级：

- 打磨前端 AI 库存建议页面的加载态、空态和错误态。
- 补充 README、接口说明和面试问答。
- 对关键接口继续增加集成测试。

第二优先级：

- 布隆过滤器防缓存穿透。
- 热点 Key 互斥重建。
- Redis 模式下的集成测试。

第三优先级：

- 给库存流水增加操作人字段。
- 增加更细的业务错误码。
- 增加部署脚本、环境变量说明和演示数据脚本。

## 7. 简短自我介绍版本

> 这个项目不是只做了 ERP 的 CRUD。我把采购、销售和库存做成了事务闭环，并通过库存流水保证可追溯；权限上用 JWT 和角色校验保护管理员操作；工程上补了统一响应、异常处理、参数校验、Swagger 和自动化测试；扩展上接了 Redis 的缓存、会话、幂等和限流，也接了 Spring AI 做只读库存分析。AI 和 Redis 都保持可选和可降级，不影响核心业务流程。
