package com.asterflow.erp.dto.ai;

import java.util.List;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AiResponseDtoTest {

    @Test
    void inventoryAdviceResponseKeepsStructuredFields() {
        AiInventoryAdviceResponse response = new AiInventoryAdviceResponse();
        response.setSummary("Inventory risk is rising.");
        response.setRisks(List.of("Mouse stock is below safety level."));
        response.setReplenishmentSuggestions(List.of("Purchase 50 units this week."));
        response.setNextActions(List.of("Check supplier lead time."));

        assertThat(response.getSummary()).isEqualTo("Inventory risk is rising.");
        assertThat(response.getRisks()).containsExactly("Mouse stock is below safety level.");
        assertThat(response.getReplenishmentSuggestions()).containsExactly("Purchase 50 units this week.");
        assertThat(response.getNextActions()).containsExactly("Check supplier lead time.");
    }

    @Test
    void dashboardSummaryResponseKeepsStructuredFields() {
        AiDashboardSummaryResponse response = new AiDashboardSummaryResponse();
        response.setSummary("Sales are stable today.");
        response.setHighlights(List.of("Purchase and sale order counts are balanced."));
        response.setRisks(List.of("Low-stock products need attention."));
        response.setNextActions(List.of("Review replenishment list before approval."));

        assertThat(response.getSummary()).isEqualTo("Sales are stable today.");
        assertThat(response.getHighlights()).containsExactly("Purchase and sale order counts are balanced.");
        assertThat(response.getRisks()).containsExactly("Low-stock products need attention.");
        assertThat(response.getNextActions()).containsExactly("Review replenishment list before approval.");
    }

    @Test
    void listFieldsDefaultToEmptyListsForFrontendRendering() {
        AiInventoryAdviceResponse inventoryAdvice = new AiInventoryAdviceResponse();
        AiDashboardSummaryResponse dashboardSummary = new AiDashboardSummaryResponse();

        assertThat(inventoryAdvice.getRisks()).isEmpty();
        assertThat(inventoryAdvice.getReplenishmentSuggestions()).isEmpty();
        assertThat(inventoryAdvice.getNextActions()).isEmpty();
        assertThat(dashboardSummary.getHighlights()).isEmpty();
        assertThat(dashboardSummary.getRisks()).isEmpty();
        assertThat(dashboardSummary.getNextActions()).isEmpty();
    }
}
