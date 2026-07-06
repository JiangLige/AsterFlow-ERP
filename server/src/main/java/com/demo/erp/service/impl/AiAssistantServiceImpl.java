package com.demo.erp.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import com.demo.erp.dto.ProductResponse;
import com.demo.erp.dto.dashboard.DashboardSummaryResponse;
import com.demo.erp.service.AiAssistantService;
import com.demo.erp.service.DashboardService;
import com.demo.erp.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class AiAssistantServiceImpl implements AiAssistantService {

    private static final Logger log = LoggerFactory.getLogger(AiAssistantServiceImpl.class);

    private final ChatClient chatClient;
    private final DashboardService dashboardService;
    private final ProductService productService;

    public AiAssistantServiceImpl(ChatClient.Builder chatClientBuilder,
                                  DashboardService dashboardService,
                                  ProductService productService) {
        this.chatClient = chatClientBuilder
                .defaultSystem("""
                        你是 AsterFlow ERP 的经营分析助手。
                        你只能根据系统提供的 ERP 数据回答，不允许编造库存、销售额或订单。
                        请用中文输出，内容简洁，适合企业管理者阅读。
                        """)
                .build();
        this.dashboardService = dashboardService;
        this.productService = productService;
    }

    @Override
    public String inventoryAdvice() {
        DashboardSummaryResponse dashboard = dashboardService.summary();
        List<ProductResponse> warningProducts = productService.warningList();

        String dashboardText = formatDashboard(dashboard);
        String warningProductText = formatWarningProducts(warningProducts);

        try {
            String content = chatClient.prompt()
                    .user("""
                            请根据下面的 ERP 数据，生成库存风险和补货建议。

                            要求：
                            1. 只能使用下面提供的数据。
                            2. 不要编造不存在的商品、库存、金额或订单。
                            3. 输出包括：经营概况、库存风险、补货建议、下一步动作。

                            Dashboard:
                            %s

                            Low stock products:
                            %s
                            """.formatted(dashboardText, warningProductText))
                    .call()
                    .content();

            if (content == null || content.isBlank()) {
                return fallbackAdvice(warningProducts);
            }

            return content;
        } catch (RuntimeException ex) {
            log.warn("Spring AI inventory advice failed", ex);
            return fallbackAdvice(warningProducts);
        }
    }

    private String formatDashboard(DashboardSummaryResponse dashboard) {
        return """
                商品总数：%s
                库存预警商品数：%s
                今日采购单数：%s
                今日销售单数：%s
                今日入库数量：%s
                今日出库数量：%s
                今日采购金额：%s
                今日销售金额：%s
                采购单状态：草稿 %s，已审批 %s，已取消 %s
                销售单状态：草稿 %s，已审批 %s，已取消 %s
                """.formatted(
                dashboard.getProductCount(),
                dashboard.getWarningProductCount(),
                dashboard.getTodayPurchaseOrderCount(),
                dashboard.getTodaySaleOrderCount(),
                dashboard.getTodayInQuantity(),
                dashboard.getTodayOutQuantity(),
                dashboard.getTodayPurchaseAmount(),
                dashboard.getTodaySaleAmount(),
                dashboard.getPurchaseDraftCount(),
                dashboard.getPurchaseApprovedCount(),
                dashboard.getPurchaseCanceledCount(),
                dashboard.getSaleDraftCount(),
                dashboard.getSaleApprovedCount(),
                dashboard.getSaleCanceledCount()
        );
    }

    private String formatWarningProducts(List<ProductResponse> warningProducts) {
        if (warningProducts == null || warningProducts.isEmpty()) {
            return "当前没有库存预警商品。";
        }

        return warningProducts.stream()
                .limit(10)
                .map(product -> "- %s / %s：当前库存 %s，最低库存 %s".formatted(
                        product.getProductCode(),
                        product.getName(),
                        product.getStock(),
                        product.getMinStock()
                ))
                .collect(Collectors.joining("\n"));
    }

    private String fallbackAdvice(List<ProductResponse> warningProducts) {
        int warningCount = warningProducts == null ? 0 : warningProducts.size();

        if (warningCount == 0) {
            return "AI 服务暂时不可用。根据当前 ERP 数据，暂无低库存商品，建议继续关注今日出入库变化。";
        }

        return "AI 服务暂时不可用。根据当前 ERP 数据，目前有 " + warningCount
                + " 个商品低于最低库存，请优先检查库存预警列表，并联系供应商安排补货。";
    }
}