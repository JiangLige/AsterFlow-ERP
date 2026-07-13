# AsterFlow ERP Portfolio Completion Plan

**Goal:** 将当前可运行 ERP 完善为可验证、可启动、可讲解的完整作品集。

**Architecture:** 保持现有单体前后端边界，不引入消息队列或分布式平台。通过 CI 质量门禁、Flyway 迁移、Docker Compose 基础设施和作品集文档完成交付闭环。

**Tech Stack:** Next.js、Vitest、Spring Boot、MyBatis-Plus、Flyway、MySQL、Redis、Docker Compose、GitHub Actions。

## 任务

- [x] CI 执行前端测试、ESLint、构建和后端验证。
- [x] 新增跨平台 `npm run verify` 验证入口。
- [x] 将破坏性数据库初始化脚本迁移为 Flyway V1 migration。
- [x] 新增 MySQL、Redis Docker Compose 和健康检查。
- [x] 更新 README 快速开始、验证和技术边界。
- [x] 新增作品集演示与面试讲解指南。
- [x] 执行最终全量验证并记录结果。
