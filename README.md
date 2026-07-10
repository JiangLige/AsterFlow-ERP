# AsterFlow ERP

[![CI](https://github.com/JiangLige/AsterFlow-ERP/actions/workflows/ci.yml/badge.svg)](https://github.com/JiangLige/AsterFlow-ERP/actions/workflows/ci.yml)

AsterFlow ERP 是一个面向面试展示的企业进销存系统，后端使用 Spring Boot + MyBatis-Plus，前端使用 Next.js。项目覆盖商品、供应商、客户、采购、销售、库存、权限、审计日志、Redis 可选增强和 Spring AI 库存建议等核心场景。

## 技术栈

- 后端：Java 21、Spring Boot 4.0.5、MyBatis-Plus 3.5.15、Spring Validation
- 前端：Next.js 14、React、TypeScript
- 数据库：MySQL 8，本地自动化测试使用 H2
- 认证：JWT access token、refresh token、local/Redis 会话存储
- 缓存与可靠性：local/Redis Dashboard 缓存、幂等提交、Redis 限流
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
- Spring AI 只读调用业务服务，模型失败时返回结构化兜底建议
- OpenAPI 文档方便接口联调和面试演示

## 本地环境要求

- Node.js 20+
- JDK 21
- MySQL 8+
- Maven 可选，项目自带 Maven Wrapper
- Redis 可选，仅当启用 Redis 模式时需要
- OpenAI API Key 可选，仅当需要真实 AI 模型输出时需要

## 初始化数据库

执行初始化脚本：

```bash
mysql -uroot -proot < server/src/main/resources/db/init.sql
```

如果本机 MySQL 密码不是 `root`，改成自己的密码。

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
```

本地开发建议先保持 `local` 模式。生产或多实例部署时，再按需启用 Redis：

```text
ERP_AUTH_SESSION_STORE=redis
ERP_CACHE_TYPE=redis
ERP_IDEMPOTENCY_STORE=redis
ERP_RATE_LIMIT_ENABLED=true
```

## 启动项目

安装依赖：

```powershell
npm install
```

同时启动前后端：

```powershell
npm run dev
```

单独启动前端：

```powershell
npm run dev:client
```

单独启动后端：

```powershell
npm run dev:server
```

常用入口：

- 前端页面：`http://localhost:3000`
- 后端接口：`http://localhost:3001`
- Swagger UI：`http://localhost:3001/swagger-ui.html`
- OpenAPI JSON：`http://localhost:3001/v3/api-docs`

## 构建与测试

前端生产构建：

```powershell
npm run build:client
```

后端完整验证：

```powershell
cd server
.\mvnw.cmd -B clean verify
```

后端测试覆盖采购、销售、库存、认证会话、API 安全边界、Redis 限流降级、AI 工具 DTO 和 OpenAPI 文档。当前完整后端验证为 `48` 个测试通过。

## 演示路径

面试演示建议按这个顺序：

```text
登录 -> Dashboard -> 库存预警 -> 新建采购单 -> 审核采购入库 -> 新建销售单 -> 审核销售出库 -> 查看库存流水 -> 打开 AI 经营助手生成库存建议
```

## 当前边界

- Redis 是可选增强，不是业务数据源；MySQL 仍负责订单、库存和流水的最终一致性。
- 布隆过滤器、缓存空值、热点 Key 互斥重建仍属于后续增强。
- 没有真实 `OPENAI_API_KEY` 时，AI 接口会走后端兜底建议，不影响其他 ERP 主流程。
- 项目定位是面试展示和工程能力说明，不是完整生产级 ERP。
