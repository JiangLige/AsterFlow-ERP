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
            description = "Read the current low-stock product list. This tool is read-only and does not modify inventory."
    )
    public List<ProductResponse> lowStockProducts() {
        return productService.warningList();
    }

    @Tool(
            name = "get_dashboard_summary",
            description = "Read the current ERP dashboard summary. This tool is read-only and does not modify business data."
    )
    public DashboardSummaryResponse dashboardSummary() {
        return dashboardService.summary();
    }
}
