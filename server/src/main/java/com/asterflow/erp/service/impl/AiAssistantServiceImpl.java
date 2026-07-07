package com.asterflow.erp.service.impl;

import java.util.List;

import com.asterflow.erp.ai.InventoryAiTools;
import com.asterflow.erp.dto.ProductResponse;
import com.asterflow.erp.dto.ai.AiInventoryAdviceResponse;
import com.asterflow.erp.service.AiAssistantService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class AiAssistantServiceImpl implements AiAssistantService {

    private static final Logger log = LoggerFactory.getLogger(AiAssistantServiceImpl.class);

    private final ChatClient chatClient;
    private final InventoryAiTools inventoryAiTools;

    public AiAssistantServiceImpl(ChatClient.Builder chatClientBuilder,
                                  InventoryAiTools inventoryAiTools) {
        this.chatClient = chatClientBuilder
                .defaultSystem("""
                        你是 AsterFlow ERP 的经营分析助手"
                        你只能根据系统提供的 ERP 数据回答，不允许编造库存、销售额或订单"
                        系统会提供只读工具，你只能调用这些工具读取数据，不能修改任何业务数据"
                        请用中文输出，内容简洁，适合企业管理者阅读"
                        """)
                .build();
        this.inventoryAiTools = inventoryAiTools;
    }

    @Override
    public AiInventoryAdviceResponse inventoryAdvice() {
        try {
            AiInventoryAdviceResponse response = chatClient.prompt()
                    .tools(inventoryAiTools)
                    .user("""
                            请调用可用的只读 ERP 工具，分析当前库存风险和经营概况"

                            请返回结构化结果，包含：
                            1. summary：经营概况总结"
                            2. risks：库存风险列表"
                            3. replenishmentSuggestions：补货建议列表"
                            4. nextActions：下一步动作列表"

                            要求"
                            1. 必须基于工具返回的真?ERP 数据回答"
                            2. 不要编造不存在的商品、库存、金额或订单"
                            3. 如果没有低库存商品，请明确说明当前暂无库存预警"
                            """)
                    .call()
                    .entity(AiInventoryAdviceResponse.class);

            if (response == null || response.getSummary().isBlank()) {
                return fallbackAdvice();
            }

            return response;
        } catch (RuntimeException ex) {
            log.warn("Spring AI structured inventory advice failed", ex);
            return fallbackAdvice();
        }
    }

    private AiInventoryAdviceResponse fallbackAdvice() {
        List<ProductResponse> warningProducts = inventoryAiTools.lowStockProducts();
        int warningCount = warningProducts == null ? 0 : warningProducts.size();

        AiInventoryAdviceResponse response = new AiInventoryAdviceResponse();

        if (warningCount == 0) {
            response.setSummary("AI 服务暂时不可用。根据当?ERP 数据，暂无低库存商品");
            response.setRisks(List.of("当前暂无库存预警商品"));
            response.setReplenishmentSuggestions(List.of("继续关注今日出入库变化"));
            response.setNextActions(List.of("稍后重新生成 AI 建议"));
            return response;
        }

        response.setSummary("AI 服务暂时不可用。根据当?ERP 数据，目前有 " + warningCount + " 个商品低于最低库存");
        response.setRisks(List.of("存在低库存商品，需要及时处理"));
        response.setReplenishmentSuggestions(List.of("优先检查库存预警列表，并联系供应商安排补货"));
        response.setNextActions(List.of("查看库存预警页面", "确认供应商交期", "创建采购单进行补货"));
        return response;
    }
}