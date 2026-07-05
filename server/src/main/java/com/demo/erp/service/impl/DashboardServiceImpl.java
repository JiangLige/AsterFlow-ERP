package com.demo.erp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.demo.erp.dto.dashboard.DashboardSummaryResponse;
import com.demo.erp.enums.PurchaseOrderStatus;
import com.demo.erp.enums.SaleOrderStatus;
import com.demo.erp.enums.StockChangeType;
import com.demo.erp.mapper.ProductMapper;
import com.demo.erp.mapper.PurchaseOrderMapper;
import com.demo.erp.mapper.SaleOrderMapper;
import com.demo.erp.mapper.StockRecordMapper;
import com.demo.erp.service.DashboardCacheService;
import com.demo.erp.service.DashboardService;
import entity.Product;
import entity.PurchaseOrder;
import entity.SaleOrder;
import entity.StockRecord;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final ProductMapper productMapper;
    private final PurchaseOrderMapper purchaseOrderMapper;
    private final SaleOrderMapper saleOrderMapper;
    private final StockRecordMapper stockRecordMapper;
    private final DashboardCacheService dashboardCacheService;


    public DashboardServiceImpl(ProductMapper productMapper,
                                PurchaseOrderMapper purchaseOrderMapper,
                                SaleOrderMapper saleOrderMapper,
                                StockRecordMapper stockRecordMapper, DashboardCacheService dashboardCacheService) {
        this.productMapper = productMapper;
        this.purchaseOrderMapper = purchaseOrderMapper;
        this.saleOrderMapper = saleOrderMapper;
        this.stockRecordMapper = stockRecordMapper;
        this.dashboardCacheService = dashboardCacheService;
    }


    @Override
    public DashboardSummaryResponse summary() {

        DashboardSummaryResponse cached = dashboardCacheService.getSummary();

        if (cached != null) {
            return cached;
        }

        LocalDate today = LocalDate.now();
        LocalDateTime start = LocalDateTime.of(today, LocalTime.MIN);
        LocalDateTime end = LocalDateTime.of(today, LocalTime.MAX);

        Long productCount = productMapper.selectCount(null);

        Long warningProductCount = productMapper.selectCount(
                new LambdaQueryWrapper<Product>()
                        .apply("stock <= min_stock")
        );

        Long todayPurchaseOrderCount = purchaseOrderMapper.selectCount(
                new LambdaQueryWrapper<PurchaseOrder>()
                        .between(PurchaseOrder::getCreatedAt, start, end)
        );

        Long todaySaleOrderCount = saleOrderMapper.selectCount(
                new LambdaQueryWrapper<SaleOrder>()
                        .between(SaleOrder::getCreatedAt, start, end)
        );

        List<StockRecord> todayInRecords = stockRecordMapper.selectList(
                new LambdaQueryWrapper<StockRecord>()
                        .eq(StockRecord::getType, StockChangeType.IN.name())
                        .between(StockRecord::getCreatedAt, start, end)
        );

        List<StockRecord> todayOutRecords = stockRecordMapper.selectList(
                new LambdaQueryWrapper<StockRecord>()
                        .eq(StockRecord::getType, StockChangeType.OUT.name())
                        .between(StockRecord::getCreatedAt, start, end)
        );

        List<PurchaseOrder> todayPurchaseOrders = purchaseOrderMapper.selectList(
                new LambdaQueryWrapper<PurchaseOrder>()
                        .between(PurchaseOrder::getCreatedAt, start, end)
        );

        BigDecimal todayPurchaseAmount = todayPurchaseOrders.stream()
                .map(PurchaseOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<SaleOrder> todaySaleOrders = saleOrderMapper.selectList(
                new LambdaQueryWrapper<SaleOrder>()
                        .between(SaleOrder::getCreatedAt, start, end)
        );

        BigDecimal todaySaleAmount = todaySaleOrders.stream()
                .map(SaleOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Integer todayInQuantity = todayInRecords.stream()
                .mapToInt(StockRecord::getChangeQuantity)
                .sum();

        Integer todayOutQuantity = todayOutRecords.stream()
                .mapToInt(record -> Math.abs(record.getChangeQuantity()))
                .sum();

        Long purchaseDraftCount = purchaseOrderMapper.selectCount(
                new LambdaQueryWrapper<PurchaseOrder>()
                        .eq(PurchaseOrder::getStatus, PurchaseOrderStatus.DRAFT.name())
        );

        Long purchaseApprovedCount = purchaseOrderMapper.selectCount(
                new LambdaQueryWrapper<PurchaseOrder>()
                        .eq(PurchaseOrder::getStatus, PurchaseOrderStatus.APPROVED.name())
        );

        Long purchaseCanceledCount = purchaseOrderMapper.selectCount(
                new LambdaQueryWrapper<PurchaseOrder>()
                        .eq(PurchaseOrder::getStatus, PurchaseOrderStatus.CANCELED.name())
        );

        Long saleDraftCount = saleOrderMapper.selectCount(
                new LambdaQueryWrapper<SaleOrder>()
                        .eq(SaleOrder::getStatus, SaleOrderStatus.DRAFT.name())
        );

        Long saleApprovedCount = saleOrderMapper.selectCount(
                new LambdaQueryWrapper<SaleOrder>()
                        .eq(SaleOrder::getStatus, SaleOrderStatus.APPROVED.name())
        );

        Long saleCanceledCount = saleOrderMapper.selectCount(
                new LambdaQueryWrapper<SaleOrder>()
                        .eq(SaleOrder::getStatus, SaleOrderStatus.CANCELED.name())
        );

        DashboardSummaryResponse response = new DashboardSummaryResponse();
        response.setProductCount(productCount);
        response.setWarningProductCount(warningProductCount);
        response.setTodayPurchaseOrderCount(todayPurchaseOrderCount);
        response.setTodaySaleOrderCount(todaySaleOrderCount);
        response.setTodayInQuantity(todayInQuantity);
        response.setTodayOutQuantity(todayOutQuantity);
        response.setTodayPurchaseAmount(todayPurchaseAmount);
        response.setTodaySaleAmount(todaySaleAmount);

        response.setPurchaseDraftCount(purchaseDraftCount);
        response.setPurchaseApprovedCount(purchaseApprovedCount);
        response.setPurchaseCanceledCount(purchaseCanceledCount);

        response.setSaleDraftCount(saleDraftCount);
        response.setSaleApprovedCount(saleApprovedCount);
        response.setSaleCanceledCount(saleCanceledCount);

        dashboardCacheService.setSummary(response);

        return response;
    }
}