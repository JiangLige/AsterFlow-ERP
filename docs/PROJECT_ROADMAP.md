# AsterFlow ERP 项目完善路线

这份路线按“能跑起�?-> 业务闭环 -> 工程质量 -> Spring AI 加分项”的顺序推进。你现在的项目已经有 Controller、Service、Mapper、DTO、实体、JWT、库存流水和采购/销售核心流程，下一步重点不是盲目加功能，而是把业务逻辑打磨到面试可讲、代码可演示�?
## 0. 当前状�?
后端�?Spring Boot 4.0.5 + MyBatis-Plus + MySQL，前端是 Next.js。业务逻辑主要�?`server/src/main/java/com/asterflow/erp/service/impl`�?
已经具备的核心业务：

- 商品管理：商品编码唯一校验、上下架、分页查询、库存预警、手动库存调整�?- 供应商管理：供应商编码唯一校验、启�?停用、分页查询�?- 采购流程：采购单创建、明细金额汇总、审核入库、取消后反向出库、库存流水�?- 销售流程：销售单创建、库存校验、审核扣库存、取消后库存回补、库存流水�?- Dashboard：商品总数、库存预警、今日出入库数量、采�?销售金额和状态统计�?- 登录认证：账号状态校验、BCrypt 密码校验、JWT 生成�?
## 1. 先把数据库跑起来

SQL 文件已经放在�?
`server/src/main/resources/db/init.sql`

执行方式�?
```bash
mysql -uroot -proot < server/src/main/resources/db/init.sql
```

如果你的 MySQL 密码不是 `root`，改成自己的密码即可。执行后默认账号�?
- 管理员：`admin / admin123`
- 普通员工：`staff / user123`

执行完之后，确认 `server/src/main/resources/application.yml` 的数据库连接信息和本机一致：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/asterflow_erp?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8
    username: root
    password: root
```

## 2. 第一阶段：修业务闭环

目标：让采购、销售、库存三条主线没有明显半成品痕迹�?
建议按这个顺序改�?
1. �?`PurchaseOrderServiceImpl.delete(Long id)`�?   - 只允许删�?`DRAFT` 状态采购单�?   - 先删除采购明细，再删除采购主单�?   - �?`@Transactional`�?
2. 修采购单更新逻辑�?   - 采购单更新不应该校验“当前库存是否足够”，因为采购是入库，不是出库�?   - 应该校验商品存在、采购数量大�?0、采购价格大�?0�?
3. 统一采购单号和销售单号生成�?   - 当前采购用了 `OrderNoGenerator`，销售自己用 `selectMaxOrderNoByPrefix`�?   - 建议销售也改成 `orderNoGenerator.generate("SO")`�?   - 这样可以讲“通过流水�?+ 唯一索引保证业务单号按天递增”�?
4. �?`OrderNoGenerator`�?   - 当前 `INSERT ... ON DUPLICATE KEY UPDATE current_value = LAST_INSERT_ID(current_value + 1)` 第一次插入时可能拿到的是自增 ID，不一定是业务流水值�?   - 更稳的写法是插入时也设置 `LAST_INSERT_ID(1)`，更新时设置 `LAST_INSERT_ID(current_value + 1)`�?
5. 清理重复代码�?   - `PurchaseOrderServiceImpl.approve` �?`sourceType/sourceId/sourceNo` 设置了两遍�?   - 销售审核里被注释掉的状态判断可以删除，保留后面的条件更新即可�?
这一阶段完成后，面试可以这样讲：

> 我把库存变化设计成单据驱动：采购审核入库、销售审核出库、取消单据时生成反向库存流水，并用事务保证订单状态、商品库存和流水记录一致�?
## 3. 第二阶段：补工程质量

目标：从“能跑”提升到“像一个认真写过的后端项目”�?
建议补这些点�?
- 增加统一错误码，例如 `PRODUCT_NOT_FOUND`、`STOCK_NOT_ENOUGH`、`ORDER_STATUS_CHANGED`�?- 给分页参数做边界限制，比�?`page >= 1`、`size <= 100`�?- 给状态字段统一用枚举校验，避免前端乱传字符串�?- 给删除操作做业务占用检查，例如商品已有订单或流水时不允许物理删除，只能停用�?- �?`StockRecord` 增加 `created_by`，记录是谁做的库存调整�?- 去掉重复�?`entity.MybatisPlusConfig`，保�?`com.asterflow.erp.config.MybatisPlusConfig`�?- 给关�?Service 写单元测试或集成测试，重点测�?  - 销售审核库存不足时回滚�?  - 销售取消后库存回补�?  - 采购审核后库存增加�?  - 非草稿单据不能修�?删除�?
## 4. 第三阶段：完善前端演�?
目标：面试时能从页面完整演示流程�?
建议页面顺序�?
1. 登录页�?2. 首页 Dashboard�?3. 商品列表 + 新增/编辑 + 库存预警�?4. 供应商列表�?5. 采购单列�?+ 新增采购�?+ 审核 + 取消�?6. 销售单列表 + 新增销售单 + 审核 + 取消�?7. 库存流水列表，可按商品、类型、时间筛选�?
演示路径可以固定为：

```text
登录 -> 查看库存预警 -> 新建采购�?-> 审核采购入库 -> 新建销售单 -> 审核销售出�?-> 查看库存流水�?Dashboard 变化
```

## 5. 第四阶段：接�?Spring AI

Spring AI 适合放在项目的“智能化加分项”，不要一开始就接。业务还没闭环时�?AI，面试官容易觉得主次不清�?
官方文档当前显示 Spring AI 2.0.0，支�?Spring Boot 4.0.x �?4.1.x。你的项目是 Spring Boot 4.0.5，可以先规划�?Spring AI 2.0.0�?
推荐先做三个轻量功能�?
1. 智能库存分析�?   - 输入当前库存、最低库存、近几天出入库流水�?   - 输出补货建议、风险商品、建议采购量�?
2. 销�?采购经营摘要�?   - 根据 Dashboard 数据生成一句自然语言摘要�?   - 例如“今日销售金�?3200 元，低库存商�?3 个，建议优先处理蓝牙打印机补货”�?
3. 单据备注生成�?   - 创建采购�?销售单时，�?AI 根据商品明细生成规范备注�?
### Maven 依赖规划

�?`server/pom.xml` �?Spring AI BOM�?
```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-bom</artifactId>
            <version>2.0.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

再加 OpenAI starter�?
```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-openai</artifactId>
</dependency>
```

配置建议放在 `application.yml`�?
```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
      chat:
        model: gpt-5-mini
```

不要�?API Key 写死进代码或提交到仓库�?
### 后端结构建议

新增包：

```text
com.asterflow.erp.ai
  AiAssistantController
  AiAssistantService
  dto
    AiInventoryAnalysisRequest
    AiInventoryAnalysisResponse
```

最小可�?Service 形态：

```java
@Service
public class AiAssistantService {

    private final ChatClient chatClient;
    private final DashboardService dashboardService;
    private final ProductService productService;

    public AiAssistantService(ChatClient.Builder builder,
                              DashboardService dashboardService,
                              ProductService productService) {
        this.chatClient = builder
                .defaultSystem("你是一个ERP系统里的库存和经营分析助手，只根据用户提供的数据回答�?)
                .build();
        this.dashboardService = dashboardService;
        this.productService = productService;
    }

    public String inventoryAdvice() {
        var summary = dashboardService.summary();
        var warnings = productService.warningList();

        return chatClient.prompt()
                .user("""
                        请根据以下ERP数据输出库存风险和补货建议�?                        Dashboard: %s
                        Low stock products: %s
                        """.formatted(summary, warnings))
                .call()
                .content();
    }
}
```

后续再升级：

- 用结构化输出，让 AI 返回 JSON�?- �?Advisor 加会话记忆�?- �?Tool Calling，让 AI 可以调用库存预警、销售统计、采购统计等 Service 方法�?- �?RAG 存放企业制度、采购规则、库存策略，�?AI 回答“为什么建议补货”�?
## 6. 面试讲法

项目亮点可以这样组织�?
- 分层设计：Controller 只负责接口入口，Service 承载业务规则，Mapper 负责数据访问�?- 事务一致性：采购/销售审核会同时修改订单状态、商品库存、库存流水�?- 库存可追溯：每次库存变化都记录变化前、变化后、类型、来源单据�?- 并发控制：订单状态更新使用条件更新，商品实体预留乐观锁字段�?- 安全认证：登录使�?BCrypt 校验密码，接口通过 JWT 识别用户和角色�?- 智能化扩展：后续�?Spring AI 做库存分析、经营摘要和补货建议�?
## 7. 推荐推进节奏

第一天：建库跑通、修采购删除、统一单号生成�?
第二天：补销�?采购边界逻辑，清理重复代码，跑通完整演示流程�?
第三天：补前端页面和接口联调，准备面试演示数据�?
第四天：接入 Spring AI 做一个最小可用的库存分析接口�?
第五天：�?README、接口说明、项目亮点和常见面试问答�?