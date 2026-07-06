package com.demo.erp.dto.ai;

import java.util.List;

public class AiInventoryAdviceResponse {

    private String summary = "";
    private List<String> risks = List.of();
    private List<String> replenishmentSuggestions = List.of();
    private List<String> nextActions = List.of();

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary == null ? "" : summary;
    }

    public List<String> getRisks() {
        return risks;
    }

    public void setRisks(List<String> risks) {
        this.risks = emptyIfNull(risks);
    }

    public List<String> getReplenishmentSuggestions() {
        return replenishmentSuggestions;
    }

    public void setReplenishmentSuggestions(List<String> replenishmentSuggestions) {
        this.replenishmentSuggestions = emptyIfNull(replenishmentSuggestions);
    }

    public List<String> getNextActions() {
        return nextActions;
    }

    public void setNextActions(List<String> nextActions) {
        this.nextActions = emptyIfNull(nextActions);
    }

    private static List<String> emptyIfNull(List<String> values) {
        return values == null ? List.of() : values;
    }
}
