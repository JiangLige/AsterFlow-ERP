package com.asterflow.erp.ai;

import com.asterflow.erp.dto.ProductResponse;
import com.asterflow.erp.dto.dashboard.DashboardSummaryResponse;
import com.asterflow.erp.service.DashboardService;
import com.asterflow.erp.service.ProductService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

class InventoryAiToolsTest {

    @Test
    void lowStockProductsReadsFromProductService() {
        ProductService productService = mock(ProductService.class);
        DashboardService dashboardService = mock(DashboardService.class);

        ProductResponse product = new ProductResponse();
        product.setId(1L);
        product.setName("Low stock product");

        when(productService.warningList()).thenReturn(List.of(product));

        InventoryAiTools tools = new InventoryAiTools(productService, dashboardService);

        List<ProductResponse> result = tools.lowStockProducts();

        assertThat(result).containsExactly(product);
        verify(productService).warningList();
        verifyNoMoreInteractions(productService, dashboardService);
    }

    @Test
    void dashboardSummaryReadsFromDashboardService() {
        ProductService productService = mock(ProductService.class);
        DashboardService dashboardService = mock(DashboardService.class);

        DashboardSummaryResponse summary = new DashboardSummaryResponse();
        summary.setProductCount(10L);
        summary.setWarningProductCount(2L);

        when(dashboardService.summary()).thenReturn(summary);

        InventoryAiTools tools = new InventoryAiTools(productService, dashboardService);

        DashboardSummaryResponse result = tools.dashboardSummary();

        assertThat(result).isSameAs(summary);
        assertThat(result.getProductCount()).isEqualTo(10L);
        assertThat(result.getWarningProductCount()).isEqualTo(2L);
        verify(dashboardService).summary();
        verifyNoMoreInteractions(productService, dashboardService);
    }
}