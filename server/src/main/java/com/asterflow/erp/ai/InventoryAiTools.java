package com.asterflow.erp.ai;

import java.util.List;

import com.asterflow.erp.dto.ProductResponse;
import com.asterflow.erp.dto.dashboard.DashboardSummaryResponse;
import com.asterflow.erp.service.DashboardService;
import com.asterflow.erp.service.ProductService;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Component
public class InventoryAiTools {

    private final ProductService productService;
    private final DashboardService dashboardService;

    public InventoryAiTools(ProductService productService, DashboardService dashboardService) {
        this.productService = productService;
        this.dashboardService = dashboardService;
    }

    @Tool(
            name = "get_low_stock_products",
            description = "查询当前低库存商品列表，只读取 ERP 数据，不修改库存。"
    )
    public List<ProductResponse> lowStockProducts() {
        return productService.warningList();
    }

    @Tool(
            name = "get_dashboard_summary",
            description = "查询当前 ERP 仪表盘汇总数据，只读取经营概况，不修改任何业务数据。"
    )
    public DashboardSummaryResponse dashboardSummary() {
        return dashboardService.summary();
    }
}
