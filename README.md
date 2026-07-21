# AsterFlow ERP

[![CI](https://github.com/JiangLige/AsterFlow-ERP/actions/workflows/ci.yml/badge.svg)](https://github.com/JiangLige/AsterFlow-ERP/actions/workflows/ci.yml)

AsterFlow ERP 是一个企业进销存系统，后端使用 Spring Boot + MyBatis-Plus，前端使用 Next.js。项目覆盖商品、供应商、客户、采购、销售、库存、权限、审计日志等核心 ERP 场景，并预留后续 Spring AI Agent 能力扩展。

## 技术栈

- 后端：Java 21、Spring Boot、MyBatis-Plus、JWT、Spring Validation
- 前端：Next.js、React、TypeScript
- 数据库：MySQL 8
- 测试：JUnit、Spring Boot Test、H2
- 文档：OpenAPI / Swagger UI
- 缓存：本地缓存，支持切换 Redis

## 核心功能

- 商品管理：新增、编辑、分页查询、库存预警、手工库存调整
- 供应商管理：新增、编辑、启用、停用、分页查询
- 客户管理：新增、编辑、删除、分页查询
- 采购管理：草稿创建、编辑、审核入库、取消扣回库存、删除草稿
- 销售管理：草稿创建、编辑、审核出库、取消恢复库存、删除草稿
- 库存管理：库存流水、库存预警、手工调整留痕
- 权限认证：JWT 登录、角色展示、前端路由保护、ADMIN 按钮控制
- 审计日志：记录库存调整、采购审核/取消、销售审核/取消等关键操作
- API 文档：Swagger UI 展示后端接口

## 企业级亮点

- 关键业务操作使用事务保护
- 库存变更生成库存流水，便于追踪来源
- 审计日志记录操作人、角色、业务对象、动作和时间
- 后端强制管理员权限校验，前端同步做角色按钮控制
- DTO 参数校验和统一异常响应
- 集成测试覆盖采购、销售、库存调整和审计日志
- OpenAPI 文档方便接口联调和演示

## 本地环境要求

- Node.js 20+
- JDK 21
- MySQL 8+
- Maven 可选，项目自带 Maven Wrapper
- Redis 可选，仅当 `ERP_CACHE_TYPE=redis` 时需要

## 初始化数据库

方式一：命令行执行：

```bash
mysql -uroot -proot < server/src/main/resources/db/init.sql