# AsterFlow ERP

[![CI](https://github.com/JiangLige/AsterFlow-ERP/actions/workflows/ci.yml/badge.svg)](https://github.com/JiangLige/AsterFlow-ERP/actions/workflows/ci.yml)

AsterFlow ERP 是一个面向面试展示的企业进销存系统，后端使用 Spring Boot + MyBatis-Plus，前端使用 Next.js。项目覆盖商品、供应商、客户、采购、销售、库存、权限、审计日志、Redis 可选增强和 Spring AI 库存建议等核心场景。

## 技术栈

- 后端：Java 21、Spring Boot 4.0.5、MyBatis-Plus 3.5.15、Spring Validation
- 前端：Next.js 14、React、TypeScript
- 数据库：MySQL 8，本地自动化测试使用 H2
- 认证：JWT access token、refresh token、local/Redis 会话存储
- 缓存与可靠性：local/Redis Dashboard 缓存、商品详情缓存、空值缓存、商品布隆过滤器、热点 Key 互斥重建、幂等提交、Redis 限流
- AI：Spring AI 2.0.0、OpenAI ChatClient、只读 Tool Calling
- 文档：OpenAPI / Swagger UI
- 测试：JUnit、Spring Boot Test、Mockito、H2

## 核心功能

- 商品管理：新增、编辑、分页查询、库存预警、手工库存调整
- 供应商管理：新增、编辑、启用、停用、分页查询
- 客户管理：新增、编辑、删除、分页查询
- 采购管理：草稿创建、编辑、审核入库、取消扣回库存、删除草稿
- 销售管理：草稿创建、编辑、审核出库、取消恢复库存、删除草稿
- 库存管理：库存流水、库存预警、手工调整留痕
- 权限认证：JWT 登录、刷新、退出、后端管理员权限校验
- 审计日志：记录库存调整、采购审核/取消、销售审核/取消等关键操作
- AI 助手：通过 `/api/ai/inventory-advice` 生成结构化库存风险与补货建议
- API 文档：Swagger UI 展示后端接口

## 工程亮点

- 关键业务操作使用事务保护，库存和单据状态一起提交或回滚
- 库存变更生成库存流水，便于追踪来源
- 审计日志记录操作人、角色、业务对象、动作和时间
- 后端强制管理员权限校验，前端角色按钮只作为体验增强
- DTO 参数校验和统一异常响应
- API 安全集成测试覆盖缺 JWT、员工越权和非法请求体
- Redis 是可选增强，本地默认 local 模式，不强依赖 Redis 服务
- 商品详情支持 local/Redis 缓存，不存在商品会短 TTL 缓存为空值以降低穿透
- 商品布隆过滤器会在启动时预热已有商品 ID，明显不存在的商品详情请求可直接拦截
- 商品详情缓存未命中时使用带 TTL 的重建锁，同一热点商品优先由一个请求回源并回填缓存
- 数据库事务提交成功后再失效商品和 Dashboard 缓存，回滚不会污染缓存
- Flyway 管理 MySQL 表结构和演示数据，避免重复初始化时破坏已有数据
- CI 同时校验前端测试、ESLint、生产构建、后端验证和 Docker Compose 配置
- Spring AI 只读调用业务服务，模型失败时返回结构化兜底建议
- OpenAPI 文档方便接口联调和面试演示

## 本地环境要求

- Node.js 20+
- JDK 21
- MySQL 8+
- Maven 可选，项目自带 Maven Wrapper
- Redis 可选，仅当启用 Redis 模式时需要
- Docker Desktop 可选，用于一键启动 MySQL 和 Redis
- OpenAI API Key 可选，仅当需要真实 AI 模型输出时需要

## 快速开始

安装依赖并启动 MySQL、Redis：

```bash
npm install
docker compose up -d
```

随后启动前后端：

```bash
npm run dev
```

后端首次连接 MySQL 时，Flyway 会自动执行
`server/src/main/resources/db/migration/V1__initialize_asterflow_schema.sql`，创建表结构和演示数据。

如果不使用 Docker，请先自行创建空数据库 `asterflow_erp`，然后按 `.env.example` 配置连接信息；不要手动重复执行迁移文件。

默认账号：

- 管理员：`admin / admin123`
- 普通员工：`staff / user123`

## 环境变量

从 `.env.example` 查看完整配置。常用配置如下：

```text
DB_URL=jdbc:mysql://localhost:3306/asterflow_erp?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8
DB_USERNAME=root
DB_PASSWORD=root

JWT_SECRET=replace-with-a-long-random-secret
OPENAI_API_KEY=replace-with-your-openai-api-key
OPENAI_CHAT_MODEL=gpt-5-mini

ERP_AUTH_SESSION_STORE=local
ERP_CACHE_TYPE=local
ERP_IDEMPOTENCY_STORE=local
ERP_RATE_LIMIT_ENABLED=false
ERP_PRODUCT_DETAIL_TTL_SECONDS=300
ERP_PRODUCT_MISSING_TTL_SECONDS=30
ERP_PRODUCT_REBUILD_LOCK_TTL_SECONDS=10
ERP_PRODUCT_REBUILD_WAIT_MILLIS=100
ERP_PRODUCT_REBUILD_RETRY_INTERVAL_MILLIS=20
ERP_PRODUCT_BLOOM_KEY=asterflow-erp:bloom:product
ERP_PRODUCT_BLOOM_BITS=1000000
FLYWAY_ENABLED=true
```

本地开发建议先保持 `local` 模式。生产或多实例部署时，再按需启用 Redis：

```text
ERP_AUTH_SESSION_STORE=redis
ERP_CACHE_TYPE=redis
ERP_IDEMPOTENCY_STORE=redis
ERP_RATE_LIMIT_ENABLED=true
```

## 启动项目

只启动基础设施：

```bash
docker compose up -d mysql redis
```

同时启动前后端：

```bash
npm run dev
```

单独启动前端：

```bash
npm run dev:client
```

单独启动后端：

```bash
npm run dev:server
```

常用入口：

- 前端页面：`http://localhost:3000`
- 后端接口：`http://localhost:3001`
- Swagger UI：`http://localhost:3001/swagger-ui.html`
- OpenAPI JSON：`http://localhost:3001/v3/api-docs`

## 构建与测试

一条命令执行作品集完整质量门禁：

```bash
npm run verify
```

该命令依次执行：

- 前端 Vitest 测试
- 前端 ESLint
- Next.js 生产构建
- 后端 Maven `clean verify`

后端测试覆盖采购、销售、库存、认证会话、API 安全边界、事务提交后缓存失效、商品详情缓存与互斥重建、商品布隆过滤器、Redis 限流降级、AI 工具 DTO 和 OpenAPI 文档。

## 演示路径

面试演示建议按这个顺序：

```text
登录 -> Dashboard -> 库存预警 -> 新建采购单 -> 审核采购入库 -> 新建销售单 -> 审核销售出库 -> 查看库存流水 -> 打开 AI 经营助手生成库存建议
```

## 当前边界

- Redis 是可选增强，不是业务数据源；MySQL 仍负责订单、库存和流水的最终一致性。
- 商品详情热点 Key 已支持 local/Redis 互斥重建；真实 Redis 集成验证、缓存雪崩治理和集群高可用仍属于后续增强。
- 没有真实 `OPENAI_API_KEY` 时，AI 接口会走后端兜底建议，不影响其他 ERP 主流程。
- 当前仓库按作品集交付标准完成；跨机房容灾、Redis Cluster、Outbox 补偿和大规模压测属于生产平台演进范围。

完整的面试讲解提纲、技术决策和验收清单见 [作品集说明](docs/PORTFOLIO_GUIDE.md)。
