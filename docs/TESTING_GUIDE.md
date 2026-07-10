# AsterFlow ERP 测试指南

这份文档说明项目目前的自动化测试覆盖范围，以及面试时如何讲清楚这些测试的价值。

## 为什么要补自动化测试

AsterFlow ERP 的核心不是简单 CRUD。一次销售审核至少会同时改变三类数据：

- 销售单状态
- 商品库存
- 库存流水

如果中间任意一步失败，前面的修改必须回滚。采购审核、采购取消、销售取消、库存调整、审计日志和权限校验也有类似的业务边界。因此项目需要 Spring 集成测试和 API 安全测试，而不是只依赖页面手动演示。

## 当前测试覆盖

### 业务事务测试

`server/src/test/java/com/asterflow/erp/service/SaleOrderServiceIntegrationTest.java`

- 审核销售单会扣减库存并创建出库流水。
- 取消已审核销售单会恢复库存并创建入库流水。
- 后续商品库存不足时，整次审核回滚，订单保持草稿状态。

`server/src/test/java/com/asterflow/erp/service/PurchaseOrderServiceIntegrationTest.java`

- 审核采购单会增加库存并创建入库流水。
- 取消已审核采购单会扣回库存并创建出库流水。
- 当前库存不足以反向扣回时，取消操作回滚。

`server/src/test/java/com/asterflow/erp/service/ProductStockAdjustServiceIntegrationTest.java`

- 手工入库、出库会更新库存并写入库存流水。
- 库存不足时不会产生部分写入。

### API 安全测试

`server/src/test/java/com/asterflow/erp/controller/ApiSecurityIntegrationTest.java`

- 受保护接口缺少 JWT 时返回 `401`。
- 普通员工访问管理员操作时返回 `403`。
- 非法请求体返回 `VALIDATION_ERROR`。

这些测试证明安全边界在后端，而不是只靠前端隐藏按钮。

### 认证和会话测试

`server/src/test/java/com/asterflow/erp/auth/AuthSessionIntegrationTest.java`

- 登录会返回 access token 和 refresh token。
- refresh token 可以换取新的 access token。
- 退出登录后旧 token 失效。

### 缓存和 Redis 相关轻量测试

`server/src/test/java/com/asterflow/erp/service/impl/ProductServiceImplTest.java`

- 商品详情命中缓存时不查询数据库。
- 数据库命中后会回写商品详情缓存。
- 不存在商品会写入短 TTL 空值缓存。
- 空值缓存命中时不查询数据库。

`server/src/test/java/com/asterflow/erp/service/impl/LocalProductCacheServiceImplTest.java`

- local 商品详情缓存可以命中并被清理。
- local 空值缓存可以标记不存在商品，并在清理后失效。

`server/src/test/java/com/asterflow/erp/interceptor/RateLimitInterceptorTest.java`

- Redis 限流超限时返回业务错误。
- Redis 异常时请求默认放行，避免缓存或限流组件拖垮主流程。

这些测试不要求本地启动 Redis。

### Spring AI 相关测试

`server/src/test/java/com/asterflow/erp/ai/InventoryAiToolsTest.java`

- AI 工具只读调用已有业务服务。
- 工具返回库存预警和 Dashboard 汇总数据。

`server/src/test/java/com/asterflow/erp/dto/ai/AiResponseDtoTest.java`

- AI 结构化响应 DTO 的字段和默认集合行为稳定。

这些测试不要求配置真实 OpenAI API Key。

### OpenAPI 和基础工具测试

- `OpenApiDocumentationTests` 验证 Swagger/OpenAPI 可以生成。
- `GlobalExceptionHandlerTest` 验证统一异常响应。
- `PageRequestUtilTest`、`EnumValidatorTest`、`ApiResponseTest` 验证通用工具和响应对象。

## 测试数据库

自动化测试使用 H2。Spring Boot 会加载：

```text
server/src/test/resources/schema.sql
```

生产或本地 MySQL 初始化仍使用：

```text
server/src/main/resources/db/init.sql
```

这样测试可以在没有本地 MySQL、Redis、OpenAI Key 的情况下运行。

## 如何运行

运行后端完整验证：

```powershell
cd server
.\mvnw.cmd -B clean verify
```

运行重点安全和 AI/Redis 轻量测试：

```powershell
cd server
.\mvnw.cmd "-Dtest=ApiSecurityIntegrationTest,AuthSessionIntegrationTest,InventoryAiToolsTest,AiResponseDtoTest,RateLimitInterceptorTest" test
```

运行采购、销售、库存业务测试：

```powershell
cd server
.\mvnw.cmd "-Dtest=SaleOrderServiceIntegrationTest,PurchaseOrderServiceIntegrationTest,ProductStockAdjustServiceIntegrationTest" test
```

前端构建：

```powershell
npm run build:client
```

当前完整后端验证结果是 `48` 个测试全部通过。

## 面试讲法

销售流程可以这样讲：

> 我写了销售单的服务级集成测试。审核销售单会扣库存并写出库流水；取消已审核销售单会生成反向入库流水；如果后续商品库存不足，整个审核会回滚，订单保持草稿状态，不会留下部分库存流水。

采购流程可以这样讲：

> 采购单审核会增加库存并记录入库流水；取消采购单会做反向出库。如果当前库存已经不够反向扣回，取消操作会失败并回滚，避免库存被扣成负数。

权限测试可以这样讲：

> 我没有只依赖前端隐藏按钮。后端 API 测试覆盖了缺少 JWT、普通员工越权和非法请求体三个场景，证明权限和校验是在服务端强制执行的。

AI 和 Redis 可以这样讲：

> AI 和 Redis 都不是测试环境的强依赖。商品详情缓存有 local 实现，Redis 限流异常时会降级放行，AI 工具测试只验证只读数据边界，真实模型调用失败时后端会返回结构化兜底建议。
