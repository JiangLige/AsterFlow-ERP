# AsterFlow ERP 面试升级方案

## 1. 当前完成度

结论：项目已经完成约 75% 到 80%，属于“可演示的业务闭环项目”，但还没有达到“高含金量面试项目”的上限。

已完成部分：

- 后端核心业务：商品、供应商、客户、采购、销售、库存流水、审计日志。
- 事务闭环：采购审核入库、采购取消反向出库、销售审核出库、销售取消回补库存。
- 权限认证：JWT 登录、角色识别、管理员操作控制。
- 工程质量：统一响应、全局异常、参数校验、Swagger/OpenAPI。
- 测试：后端 21 个测试通过，覆盖采购、销售、库存、审计日志和 OpenAPI。
- Redis：已经有 `spring-boot-starter-data-redis`，Dashboard 支持 `local` 和 `redis` 两种缓存实现。

缺口部分：

- Spring AI 还没有真正接入，目前只在路线文档里规划。
- Redis 缓存只有基础读写，没有完整的缓存穿透、击穿、雪崩、Redis 宕机降级方案。
- 布隆过滤器还没有实现。
- MySQL 并发扣库存虽然用了条件更新，但没有形成一套可讲清楚的“并发一致性方案”。
- 面试问答还不够系统，需要把故障场景和解决方案写进项目文档。

## 2. 方案是否需要重改

不需要推倒重写，但建议把方案升级成“业务系统 + 高并发缓存 + AI 助手”的版本。

新的项目定位建议：

> AsterFlow ERP 是一个面向中小企业进销存场景的 Spring Boot + Next.js 系统，核心强调库存一致性、业务可追溯、权限审计、缓存加速和 Spring AI 智能经营分析。

这样比单纯“ERP CRUD 项目”更有含金量，因为它能讲：

- 业务闭环：采购、销售、库存联动。
- 数据一致性：事务、条件更新、库存流水。
- 性能优化：Redis 缓存、缓存失效、热点数据。
- 高可用：Redis 挂了以后降级查 MySQL。
- 防护能力：布隆过滤器防缓存穿透。
- 智能化：Spring AI 做库存分析和补货建议。

## 3. Spring AI 接入状态

当前状态：未接入。

`server/pom.xml` 里还没有 Spring AI BOM，也没有 `spring-ai-starter-model-openai`。`application.yml` 里也没有 `spring.ai.openai` 配置。

建议后续接入方式：

- 不让 AI 直接改数据库。
- AI 只读取 Dashboard、库存预警、销售/采购摘要。
- AI 输出经营摘要、库存风险和补货建议。
- 关键操作仍走原来的 Service 和权限体系。

### 需要加入的 Maven 配置

意思：`dependencyManagement` 负责锁定 Spring AI 版本，真正的 starter 负责接入 OpenAI 模型。

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

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-openai</artifactId>
</dependency>
```

注意：Spring AI 2.0.0 是 Spring Boot 4.0/4.1 时代的版本，和本项目 Spring Boot 4.0.5 方向匹配。但接入前要重新跑 `mvnw test`，确认依赖没有把 Boot 版本拉乱。

### 需要加入的 application.yml 配置

意思：API Key 从环境变量读取，不能写死到代码里。`enabled=false` 表示默认不开 AI，避免没有 Key 时项目启动失败。

```yaml
erp:
  ai:
    enabled: ${ERP_AI_ENABLED:false}

spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY:}
      chat:
        model: ${OPENAI_MODEL:gpt-5-mini}
```

### Spring AI 最小代码

新增文件：`server/src/main/java/com/demo/erp/ai/AiAssistantService.java`

意思：这个 Service 把 Dashboard 数据交给 AI，让 AI 生成库存风险和经营建议。它只读数据，不改库存，所以安全。

```java
package com.demo.erp.ai;

import com.demo.erp.dto.dashboard.DashboardSummaryResponse;
import com.demo.erp.service.DashboardService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "erp.ai.enabled", havingValue = "true")
public class AiAssistantService {

    private final ChatClient chatClient;
    private final DashboardService dashboardService;

    public AiAssistantService(ChatClient.Builder builder,
                              DashboardService dashboardService) {
        this.chatClient = builder
                .defaultSystem("你是ERP系统里的库存和经营分析助手。只根据系统提供的数据回答，不编造数据。")
                .build();
        this.dashboardService = dashboardService;
    }

    public String dashboardAdvice() {
        DashboardSummaryResponse summary = dashboardService.summary();

        return chatClient.prompt()
                .user("""
                        请根据以下ERP经营数据，输出：
                        1. 今日经营摘要
                        2. 库存风险
                        3. 采购和销售建议

                        Dashboard数据：%s
                        """.formatted(summary))
                .call()
                .content();
    }
}
```

新增文件：`server/src/main/java/com/demo/erp/ai/AiAssistantController.java`

意思：给前端或 Swagger 提供一个 AI 分析接口。

```java
package com.demo.erp.ai;

import com.demo.erp.common.ApiResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@ConditionalOnProperty(name = "erp.ai.enabled", havingValue = "true")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    public AiAssistantController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    @GetMapping("/dashboard-advice")
    public ApiResponse<String> dashboardAdvice() {
        return ApiResponse.success(aiAssistantService.dashboardAdvice());
    }
}
```

面试讲法：

> 我没有让 AI 绕过业务系统直接操作数据库，而是把它设计成只读分析助手。AI 通过已有 Service 获取 Dashboard 和库存数据，生成经营摘要和补货建议。这样既能展示 Spring AI 能力，又不会破坏 ERP 的权限和事务边界。

## 4. Redis 缓存现状和升级方案

当前状态：

- `ERP_CACHE_TYPE=local` 时使用本地缓存。
- `ERP_CACHE_TYPE=redis` 时使用 Redis 缓存 Dashboard。
- 缓存 TTL 是 60 秒。
- 库存变化后会删除 Dashboard 缓存。

当前不足：

- Redis 挂了以后，`RedisDashboardCacheServiceImpl` 可能抛异常，影响接口。
- 没有缓存空值，容易被不存在的 ID 穿透到 MySQL。
- 没有布隆过滤器。
- 没有热点 Key 互斥重建。

### Redis 挂了怎么办

推荐策略：缓存只是加速层，不能影响核心业务。Redis 挂了以后直接查 MySQL，并记录日志。

可改造 `RedisDashboardCacheServiceImpl`：

```java
@Override
public DashboardSummaryResponse getSummary() {
    try {
        String json = stringRedisTemplate.opsForValue().get(KEY);

        if (json == null || json.isBlank()) {
            return null;
        }

        return objectMapper.readValue(json, DashboardSummaryResponse.class);
    } catch (Exception e) {
        return null;
    }
}

@Override
public void setSummary(DashboardSummaryResponse summary) {
    try {
        String json = objectMapper.writeValueAsString(summary);
        stringRedisTemplate.opsForValue().set(KEY, json, TTL);
    } catch (Exception e) {
        // Redis写入失败不能影响主流程，降级为查数据库。
    }
}

@Override
public void evictSummary() {
    try {
        stringRedisTemplate.delete(KEY);
    } catch (Exception e) {
        // 删除缓存失败时，最多短时间读到旧Dashboard，不能让库存业务失败。
    }
}
```

面试讲法：

> 我的设计里 Redis 是旁路缓存，不是核心数据源。Redis 不可用时，接口降级查 MySQL；写缓存和删缓存失败只记录日志，不阻断采购、销售、库存这些主流程。

## 5. 布隆过滤器怎么加

适合场景：防止大量请求查询不存在的商品 ID，导致缓存没命中后全部打到 MySQL。

请求链路：

```text
查询商品详情 -> 布隆过滤器判断ID是否可能存在
不存在 -> 直接返回商品不存在
可能存在 -> 查Redis缓存
缓存命中 -> 返回
缓存未命中 -> 查MySQL -> 回写Redis
```

最小代码思路：

```java
public interface ProductBloomFilter {
    boolean mightContain(Long productId);
    void put(Long productId);
}
```

Redis Bitmap 实现：

```java
package com.demo.erp.cache;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
@ConditionalOnProperty(name = "erp.cache.type", havingValue = "redis")
public class RedisProductBloomFilter implements ProductBloomFilter {

    private static final String KEY = "asterflow-erp:bloom:product";
    private static final int BIT_SIZE = 1_000_000;

    private final StringRedisTemplate stringRedisTemplate;

    public RedisProductBloomFilter(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @Override
    public boolean mightContain(Long productId) {
        int[] offsets = offsets(productId);
        for (int offset : offsets) {
            Boolean hit = stringRedisTemplate.opsForValue().getBit(KEY, offset);
            if (!Boolean.TRUE.equals(hit)) {
                return false;
            }
        }
        return true;
    }

    @Override
    public void put(Long productId) {
        for (int offset : offsets(productId)) {
            stringRedisTemplate.opsForValue().setBit(KEY, offset, true);
        }
    }

    private int[] offsets(Long productId) {
        String value = String.valueOf(productId);
        return new int[] {
                hash(value, "MD5"),
                hash(value, "SHA-1"),
                hash(value, "SHA-256")
        };
    }

    private int hash(String value, String algorithm) {
        try {
            MessageDigest digest = MessageDigest.getInstance(algorithm);
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            int hash = 0;
            for (int i = 0; i < 4; i++) {
                hash = (hash << 8) | (bytes[i] & 0xff);
            }
            return Math.floorMod(hash, BIT_SIZE);
        } catch (Exception e) {
            throw new IllegalStateException("Bloom filter hash failed", e);
        }
    }
}
```

面试讲法：

> 布隆过滤器用于挡住一定不存在的数据，例如不存在的商品 ID。它可能误判存在，但不会误判不存在。误判存在最多再查一次缓存或数据库；判断不存在就可以直接返回，从而防止缓存穿透。

## 6. Redis 面试高频问题

缓存穿透：

- 问题：查不存在的数据，缓存没有，MySQL 也没有，每次都打到数据库。
- 解决：布隆过滤器 + 缓存空值。

缓存击穿：

- 问题：热点 Key 过期，大量请求同时查 MySQL。
- 解决：互斥锁重建缓存，或者热点 Key 逻辑过期。

缓存雪崩：

- 问题：大量 Key 同时过期，或者 Redis 整体不可用。
- 解决：TTL 加随机值、热点数据预热、Redis 高可用、服务降级查 MySQL。

Redis 宕机：

- 问题：缓存读写异常，接口可能失败。
- 解决：捕获 Redis 异常，降级查 MySQL；Redis 恢复后自动重新写入缓存；核心写操作不依赖 Redis 成功。

缓存一致性：

- 问题：MySQL 改了，Redis 还是旧数据。
- 解决：先写 MySQL，再删除缓存。读请求未命中时重新查 MySQL 并回写缓存。

## 7. MySQL 面试高频问题

事务一致性：

- 采购审核、销售审核、库存流水必须在同一个事务里。
- 任意一步失败都要回滚。

库存超卖：

- 不能先查库存再直接更新。
- 应该使用条件更新：`where stock >= quantity`。
- 更新行数为 0 表示库存不足或并发冲突。

索引设计：

- 商品编码、订单号要唯一索引。
- 状态、创建时间、商品 ID、来源单据要普通索引。
- 库存预警可以用 `(stock, min_stock)` 辅助查询。

慢查询：

- 分页查询要避免无条件全表扫。
- 列表接口要限制 `size <= 100`。
- 常用筛选字段加索引。

## 8. 后续开发优先级

第一优先级：

- 给 Redis 缓存加异常降级。
- 增加缓存空值和布隆过滤器。
- 给分页参数加最大值限制。
- 增加更多业务错误码。

第二优先级：

- 接入 Spring AI 最小接口。
- 做 AI 库存分析页面或 Swagger 演示。
- 补 Spring AI 接口测试，默认关闭 AI 时测试不受影响。

第三优先级：

- 增加商品详情缓存。
- 增加热点 Key 互斥重建。
- 给库存流水增加操作人字段。
- 写完整面试问答文档。

