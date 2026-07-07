package com.asterflow.erp.dto.dashboard;

import java.math.BigDecimal;

public class DashboardSummaryResponse {

    private Long productCount;
    private Long warningProductCount;
    private Long todayPurchaseOrderCount;
    private Long todaySaleOrderCount;
    private Integer todayInQuantity;
    private Integer todayOutQuantity;
    private BigDecimal todayPurchaseAmount;
    private BigDecimal todaySaleAmount;private Long purchaseDraftCount;
    private Long purchaseApprovedCount;
    private Long purchaseCanceledCount;

    private Long saleDraftCount;
    private Long saleApprovedCount;
    private Long saleCanceledCount;

    public Long getPurchaseDraftCount() {
        return purchaseDraftCount;
    }

    public void setPurchaseDraftCount(Long purchaseDraftCount) {
        this.purchaseDraftCount = purchaseDraftCount;
    }

    public Long getPurchaseApprovedCount() {
        return purchaseApprovedCount;
    }

    public void setPurchaseApprovedCount(Long purchaseApprovedCount) {
        this.purchaseApprovedCount = purchaseApprovedCount;
    }

    public Long getPurchaseCanceledCount() {
        return purchaseCanceledCount;
    }

    public void setPurchaseCanceledCount(Long purchaseCanceledCount) {
        this.purchaseCanceledCount = purchaseCanceledCount;
    }

    public Long getSaleDraftCount() {
        return saleDraftCount;
    }

    public void setSaleDraftCount(Long saleDraftCount) {
        this.saleDraftCount = saleDraftCount;
    }

    public Long getSaleApprovedCount() {
        return saleApprovedCount;
    }

    public void setSaleApprovedCount(Long saleApprovedCount) {
        this.saleApprovedCount = saleApprovedCount;
    }

    public Long getSaleCanceledCount() {
        return saleCanceledCount;
    }

    public void setSaleCanceledCount(Long saleCanceledCount) {
        this.saleCanceledCount = saleCanceledCount;
    }

    public BigDecimal getTodayPurchaseAmount() {
        return todayPurchaseAmount;
    }

    public BigDecimal getTodaySaleAmount() {
        return todaySaleAmount;
    }

    public void setTodaySaleAmount(BigDecimal todaySaleAmount) {
        this.todaySaleAmount = todaySaleAmount;
    }

    public void setTodayPurchaseAmount(BigDecimal todayPurchaseAmount) {
        this.todayPurchaseAmount = todayPurchaseAmount;
    }

    public Long getProductCount() {
        return productCount;
    }

    public void setProductCount(Long productCount) {
        this.productCount = productCount;
    }

    public Long getWarningProductCount() {
        return warningProductCount;
    }

    public void setWarningProductCount(Long warningProductCount) {
        this.warningProductCount = warningProductCount;
    }

    public Long getTodayPurchaseOrderCount() {
        return todayPurchaseOrderCount;
    }

    public void setTodayPurchaseOrderCount(Long todayPurchaseOrderCount) {
        this.todayPurchaseOrderCount = todayPurchaseOrderCount;
    }

    public Long getTodaySaleOrderCount() {
        return todaySaleOrderCount;
    }

    public void setTodaySaleOrderCount(Long todaySaleOrderCount) {
        this.todaySaleOrderCount = todaySaleOrderCount;
    }

    public Integer getTodayInQuantity() {
        return todayInQuantity;
    }

    public void setTodayInQuantity(Integer todayInQuantity) {
        this.todayInQuantity = todayInQuantity;
    }

    public Integer getTodayOutQuantity() {
        return todayOutQuantity;
    }

    public void setTodayOutQuantity(Integer todayOutQuantity) {
        this.todayOutQuantity = todayOutQuantity;
    }
}
