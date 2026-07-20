# AsterFlow ERP 架构说明

## 1. 系统定位

AsterFlow ERP 是一个进销存业务系统，围绕商品、供应商、客户、采购、销售、库存和审计日志构建完整业务闭环。

系统目标不是单纯 CRUD，而是模拟企业内部 ERP 的核心流程：

- 采购单审核后自动入库
- 销售单审核后自动出库
- 库存变化自动记录流水
- 关键业务操作写入审计日志
- 管理员权限控制高风险操作
- OpenAPI / Swagger UI 支持接口联调和面试展示

## 2. 技术架构

```mermaid
flowchart LR
    User["用户 / 浏览器"] --> FE["Next.js 前端页面"]
    FE --> Proxy["Next.js API Route 代理"]
    Proxy --> BE["Spring Boot REST API"]

    BE --> Auth["JWT 登录认证 / 权限校验"]
    BE --> Controller["Controller 接口层"]
    Controller --> Service["Service 业务层"]
    Service --> Mapper["MyBatis-Plus Mapper"]
    Mapper --> DB[("MySQL 数据库")]

    Service --> Stock["库存服务"]
    Service --> Audit["审计日志服务"]
    BE --> Docs["OpenAPI / Swagger UI"]