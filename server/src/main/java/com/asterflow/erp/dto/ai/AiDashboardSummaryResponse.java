package com.asterflow.erp.dto.ai;

import java.util.List;

public class AiDashboardSummaryResponse {

    private String summary = "";
    private List<String> highlights = List.of();
    private List<String> risks = List.of();
    private List<String> nextActions = List.of();

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary == null ? "" : summary;
    }

    public List<String> getHighlights() {
        return highlights;
    }

    public void setHighlights(List<String> highlights) {
        this.highlights = emptyIfNull(highlights);
    }

    public List<String> getRisks() {
        return risks;
    }

    public void setRisks(List<String> risks) {
        this.risks = emptyIfNull(risks);
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
