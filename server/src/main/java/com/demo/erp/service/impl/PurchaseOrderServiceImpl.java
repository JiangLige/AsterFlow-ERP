package com.demo.erp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.erp.common.BusinessException;
import com.demo.erp.common.OrderNoGenerator;
import com.demo.erp.dto.*;
import com.demo.erp.dto.inventory.InventoryChangeCommand;
import com.demo.erp.enums.PurchaseOrderStatus;
import com.demo.erp.mapper.*;
import com.demo.erp.service.DashboardCacheService;
import com.demo.erp.service.InventoryService;
import com.demo.erp.service.PurchaseOrderService;
import entity.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderMapper purchaseOrderMapper;
    private final PurchaseOrderItemMapper purchaseOrderItemMapper;
    private final SupplierMapper supplierMapper;
    private final ProductMapper productMapper;
    private final OrderNoGenerator orderNoGenerator;
    private final InventoryService inventoryService;
    private final DashboardCacheService dashboardCacheService;

    public PurchaseOrderServiceImpl(PurchaseOrderMapper purchaseOrderMapper,
                                    PurchaseOrderItemMapper purchaseOrderItemMapper,
                                    SupplierMapper supplierMapper,
                                    ProductMapper productMapper,
                                    OrderNoGenerator orderNoGenerator, InventoryService inventoryService, DashboardCacheService dashboardCacheService) {
        this.purchaseOrderMapper = purchaseOrderMapper;
        this.purchaseOrderItemMapper = purchaseOrderItemMapper;
        this.supplierMapper = supplierMapper;
        this.productMapper = productMapper;
        this.orderNoGenerator = orderNoGenerator;
        this.inventoryService = inventoryService;
        this.dashboardCacheService = dashboardCacheService;
    }

    @Override
    @Transactional
    public PurchaseOrderResponse create(PurchaseOrderCreateRequest request) {
        Supplier supplier = supplierMapper.selectById(request.getSupplierId());

        if (supplier == null) {
            throw new BusinessException("供应商不存在");
        }

        PurchaseOrder purchaseOrder = new PurchaseOrder();
        purchaseOrder.setOrderNo(orderNoGenerator.generate("PO"));
        purchaseOrder.setSupplierId(supplier.getId());
        purchaseOrder.setSupplierName(supplier.getName());
        purchaseOrder.setStatus(PurchaseOrderStatus.DRAFT.name());
        purchaseOrder.setRemark(request.getRemark());
        purchaseOrder.setTotalAmount(BigDecimal.ZERO);

        purchaseOrderMapper.insert(purchaseOrder);

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (PurchaseOrderItemRequest itemRequest : request.getItems()) {
            Product product = productMapper.selectById(itemRequest.getProductId());

            if (product == null) {
                throw new BusinessException("商品不存在");
            }

            BigDecimal amount = itemRequest.getPrice()
                    .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setPurchaseOrderId(purchaseOrder.getId());
            item.setProductId(product.getId());
            item.setProductCode(product.getProductCode());
            item.setProductName(product.getName());
            item.setQuantity(itemRequest.getQuantity());
            item.setPrice(itemRequest.getPrice());
            item.setAmount(amount);



            purchaseOrderItemMapper.insert(item);

            totalAmount = totalAmount.add(amount);
        }

        purchaseOrder.setTotalAmount(totalAmount);
        purchaseOrderMapper.updateById(purchaseOrder);

        dashboardCacheService.evictSummary();

        return getById(purchaseOrder.getId());
    }

    @Override
    public PurchaseOrderResponse getById(Long id) {
        PurchaseOrder purchaseOrder = purchaseOrderMapper.selectById(id);

        if (purchaseOrder == null) {
            throw new BusinessException("采购单不存在");
        }

        return toResponse(purchaseOrder);
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder purchaseOrder) {
        PurchaseOrderResponse response = new PurchaseOrderResponse();

        response.setId(purchaseOrder.getId());
        response.setOrderNo(purchaseOrder.getOrderNo());
        response.setSupplierId(purchaseOrder.getSupplierId());
        response.setSupplierName(purchaseOrder.getSupplierName());
        response.setTotalAmount(purchaseOrder.getTotalAmount());
        response.setStatus(purchaseOrder.getStatus());
        response.setRemark(purchaseOrder.getRemark());
        response.setCreatedAt(purchaseOrder.getCreatedAt());
        response.setUpdatedAt(purchaseOrder.getUpdatedAt());

        List<PurchaseOrderItem> items = purchaseOrderItemMapper.selectList(
                new LambdaQueryWrapper<PurchaseOrderItem>()
                        .eq(PurchaseOrderItem::getPurchaseOrderId, purchaseOrder.getId())
        );

        List<PurchaseOrderItemResponse> itemResponses = items.stream()
                .map(this::toItemResponse)
                .toList();

        response.setItems(itemResponses);

        return response;
    }

    private PurchaseOrderItemResponse toItemResponse(PurchaseOrderItem item) {
        PurchaseOrderItemResponse response = new PurchaseOrderItemResponse();

        response.setId(item.getId());
        response.setProductId(item.getProductId());
        response.setProductCode(item.getProductCode());
        response.setProductName(item.getProductName());
        response.setQuantity(item.getQuantity());
        response.setPrice(item.getPrice());
        response.setAmount(item.getAmount());

        return response;
    }

    @Override
    public PageResponse<PurchaseOrderResponse> pageList(String keyword, String status, long page, long size) {
        LambdaQueryWrapper<PurchaseOrder> wrapper = new LambdaQueryWrapper<>();

        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w.like(PurchaseOrder::getOrderNo, keyword)
                    .or()
                    .like(PurchaseOrder::getSupplierName, keyword));
        }

        if (status != null && !status.isBlank()) {
            wrapper.eq(PurchaseOrder::getStatus, status);
        }

        wrapper.orderByDesc(PurchaseOrder::getCreatedAt)
                .orderByDesc(PurchaseOrder::getId);

        Page<PurchaseOrder> purchaseOrderPage = new Page<>(page, size);

        Page<PurchaseOrder> result = purchaseOrderMapper.selectPage(purchaseOrderPage, wrapper);

        List<PurchaseOrderResponse> records = result.getRecords()
                .stream()
                .map(this::toSimpleResponse)
                .toList();

        return new PageResponse<>(
                records,
                result.getTotal(),
                result.getCurrent(),
                result.getSize(),
                result.getPages()
        );
    }

    @Override
    @Transactional
    public void approve(Long id) {
        PurchaseOrder purchaseOrder = purchaseOrderMapper.selectById(id);

        if (purchaseOrder == null) {
            throw new BusinessException("采购单不存在");
        }

        if (!PurchaseOrderStatus.DRAFT.name().equals(purchaseOrder.getStatus())) {
            throw new BusinessException("只有草稿状态的采购单可以审核");
        }

        List<PurchaseOrderItem> items = purchaseOrderItemMapper.selectList(
                new LambdaQueryWrapper<PurchaseOrderItem>()
                        .eq(PurchaseOrderItem::getPurchaseOrderId, id)
        );

        if (items.isEmpty()) {
            throw new BusinessException("采购单明细不能为空");
        }

        for (PurchaseOrderItem item : items) {
            Product product = productMapper.selectById(item.getProductId());

            if (product == null) {
                throw new BusinessException("商品不存在");
            }

            inventoryService.inbound(new InventoryChangeCommand(
                    item.getProductId(),
                    item.getQuantity(),
                    "PURCHASE_ORDER",
                    purchaseOrder.getId(),
                    purchaseOrder.getOrderNo(),
                    "采购入库：" + purchaseOrder.getOrderNo()
            ));
        }

        int rows = purchaseOrderMapper.update(
                null,
                new LambdaUpdateWrapper<PurchaseOrder>()
                        .eq(PurchaseOrder::getId, id)
                        .eq(PurchaseOrder::getStatus, PurchaseOrderStatus.DRAFT.name())
                        .set(PurchaseOrder::getStatus, PurchaseOrderStatus.APPROVED.name())
        );

        if (rows == 0) {
            throw new BusinessException("采购单状态已变化，请刷新后重试");
        }

        dashboardCacheService.evictSummary();

    }

    @Override
    @Transactional
    public void delete(Long id) {
        PurchaseOrder purchaseOrder = purchaseOrderMapper.selectById(id);

        if (purchaseOrder == null) {
            throw new BusinessException("采购单不存在");
        }

        if (!PurchaseOrderStatus.DRAFT.name().equals(purchaseOrder.getStatus())) {
            throw new BusinessException("只有草稿状态的采购单可以删除");
        }

        purchaseOrderItemMapper.delete(
                new LambdaQueryWrapper<PurchaseOrderItem>()
                        .eq(PurchaseOrderItem::getPurchaseOrderId, id)
        );

        purchaseOrderMapper.deleteById(id);
        dashboardCacheService.evictSummary();
    }

    @Override
    @Transactional
    public PurchaseOrderResponse update(Long id, PurchaseOrderCreateRequest request) {
        PurchaseOrder purchaseOrder = purchaseOrderMapper.selectById(id);

        if (purchaseOrder == null) {
            throw new BusinessException("采购单不存在");
        }

        if (!PurchaseOrderStatus.DRAFT.name().equals(purchaseOrder.getStatus())) {
            throw new BusinessException("只有草稿状态的采购单可以修改");
        }

        Supplier supplier = supplierMapper.selectById(request.getSupplierId());

        if (supplier == null) {
            throw new BusinessException("供应商不存在");
        }

        purchaseOrder.setSupplierId(supplier.getId());
        purchaseOrder.setSupplierName(supplier.getName());
        purchaseOrder.setRemark(request.getRemark());

        purchaseOrderItemMapper.delete(
                new LambdaQueryWrapper<PurchaseOrderItem>()
                        .eq(PurchaseOrderItem::getPurchaseOrderId, id)
        );

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (PurchaseOrderItemRequest itemRequest : request.getItems()) {
            Product product = productMapper.selectById(itemRequest.getProductId());

            if (product == null) {
                throw new BusinessException("商品不存在");
            }

            BigDecimal amount = itemRequest.getPrice()
                    .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setPurchaseOrderId(purchaseOrder.getId());
            item.setProductId(product.getId());
            item.setProductCode(product.getProductCode());
            item.setProductName(product.getName());
            item.setQuantity(itemRequest.getQuantity());
            item.setPrice(itemRequest.getPrice());
            item.setAmount(amount);

            purchaseOrderItemMapper.insert(item);

            totalAmount = totalAmount.add(amount);
        }

        purchaseOrder.setTotalAmount(totalAmount);
        purchaseOrderMapper.updateById(purchaseOrder);

        dashboardCacheService.evictSummary();

        return getById(id);

    }

    @Override
    @Transactional
    public void cancel(Long id) {
        PurchaseOrder purchaseOrder = purchaseOrderMapper.selectById(id);

        if (purchaseOrder == null) {
            throw new BusinessException("采购单不存在");
        }

        if (!PurchaseOrderStatus.APPROVED.name().equals(purchaseOrder.getStatus())) {
            throw new BusinessException("只有已审核采购单可以取消");
        }

        int rows = purchaseOrderMapper.update(
                null,
                new LambdaUpdateWrapper<PurchaseOrder>()
                        .eq(PurchaseOrder::getId, id)
                        .eq(PurchaseOrder::getStatus, PurchaseOrderStatus.APPROVED.name())
                        .set(PurchaseOrder::getStatus, PurchaseOrderStatus.CANCELED.name())
        );

        if (rows == 0) {
            throw new BusinessException("采购单状态已变化，请刷新后重试");
        }

        List<PurchaseOrderItem> items = purchaseOrderItemMapper.selectList(
                new LambdaQueryWrapper<PurchaseOrderItem>()
                        .eq(PurchaseOrderItem::getPurchaseOrderId, id)
        );

        if (items.isEmpty()) {
            throw new BusinessException("采购单明细不能为空");
        }

        for (PurchaseOrderItem item : items) {
            Product product = productMapper.selectById(item.getProductId());

            if (product == null) {
                throw new BusinessException("商品不存在");
            }

            inventoryService.outbound(new InventoryChangeCommand(
                    item.getProductId(),
                    item.getQuantity(),
                    "PURCHASE_ORDER_CANCEL",
                    purchaseOrder.getId(),
                    purchaseOrder.getOrderNo(),
                    "采购取消出库：" + purchaseOrder.getOrderNo()
            ));
        }

        dashboardCacheService.evictSummary();

    }

    private PurchaseOrderResponse toSimpleResponse(PurchaseOrder purchaseOrder) {
        PurchaseOrderResponse response = new PurchaseOrderResponse();

        response.setId(purchaseOrder.getId());
        response.setOrderNo(purchaseOrder.getOrderNo());
        response.setSupplierId(purchaseOrder.getSupplierId());
        response.setSupplierName(purchaseOrder.getSupplierName());
        response.setTotalAmount(purchaseOrder.getTotalAmount());
        response.setStatus(purchaseOrder.getStatus());
        response.setRemark(purchaseOrder.getRemark());
        response.setCreatedAt(purchaseOrder.getCreatedAt());
        response.setUpdatedAt(purchaseOrder.getUpdatedAt());

        return response;
    }
}
