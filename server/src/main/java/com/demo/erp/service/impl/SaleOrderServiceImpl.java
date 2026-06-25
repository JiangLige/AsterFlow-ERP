package com.demo.erp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.erp.common.BusinessException;
import com.demo.erp.common.OrderNoGenerator;
import com.demo.erp.dto.PageResponse;
import com.demo.erp.dto.inventory.InventoryChangeCommand;
import com.demo.erp.dto.sale.SaleOrderCreateRequest;
import com.demo.erp.dto.sale.SaleOrderItemRequest;
import com.demo.erp.dto.sale.SaleOrderItemResponse;
import com.demo.erp.dto.sale.SaleOrderResponse;
import com.demo.erp.enums.SaleOrderStatus;
import com.demo.erp.mapper.ProductMapper;
import com.demo.erp.mapper.SaleOrderItemMapper;
import com.demo.erp.mapper.SaleOrderMapper;
import com.demo.erp.service.InventoryService;
import com.demo.erp.service.SaleOrderService;
import entity.Product;
import entity.SaleOrder;
import entity.SaleOrderItem;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
public class SaleOrderServiceImpl implements SaleOrderService {

    private final SaleOrderMapper saleOrderMapper;
    private final SaleOrderItemMapper saleOrderItemMapper;
    private final ProductMapper productMapper;
    private final OrderNoGenerator orderNoGenerator;
    private final InventoryService inventoryService;

    public SaleOrderServiceImpl(SaleOrderMapper saleOrderMapper,
                                SaleOrderItemMapper saleOrderItemMapper,
                                ProductMapper productMapper,
                                OrderNoGenerator orderNoGenerator, InventoryService inventoryService) {
        this.saleOrderMapper = saleOrderMapper;
        this.saleOrderItemMapper = saleOrderItemMapper;
        this.productMapper = productMapper;
        this.orderNoGenerator = orderNoGenerator;
        this.inventoryService = inventoryService;
    }

    @Override
    @Transactional
    public SaleOrderResponse create(SaleOrderCreateRequest request) {
        SaleOrder saleOrder = new SaleOrder();
        saleOrder.setOrderNo(orderNoGenerator.generate("SO"));
        saleOrder.setCustomerName(request.getCustomerName());
        saleOrder.setStatus(SaleOrderStatus.DRAFT.name());
        saleOrder.setRemark(request.getRemark());
        saleOrder.setTotalAmount(BigDecimal.ZERO);

        saleOrderMapper.insert(saleOrder);

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (SaleOrderItemRequest itemRequest : request.getItems()) {
            Product product = productMapper.selectById(itemRequest.getProductId());

            if (product == null) {
                throw new BusinessException("商品不存在");
            }

            if (product.getStock() < itemRequest.getQuantity()) {
                throw new BusinessException("商品库存不足：" + product.getName());
            }


            BigDecimal amount = itemRequest.getPrice()
                    .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            SaleOrderItem item = new SaleOrderItem();
            item.setSaleOrderId(saleOrder.getId());
            item.setProductId(product.getId());
            item.setProductCode(product.getProductCode());
            item.setProductName(product.getName());
            item.setQuantity(itemRequest.getQuantity());
            item.setPrice(itemRequest.getPrice());
            item.setAmount(amount);

            saleOrderItemMapper.insert(item);

            totalAmount = totalAmount.add(amount);
        }

        saleOrder.setTotalAmount(totalAmount);
        saleOrderMapper.updateById(saleOrder);

        return getById(saleOrder.getId());
    }

    @Override
    public SaleOrderResponse getById(Long id) {
        SaleOrder saleOrder = saleOrderMapper.selectById(id);

        if (saleOrder == null) {
            throw new BusinessException("销售单不存在");
        }

        return toResponse(saleOrder);
    }

    private SaleOrderResponse toResponse(SaleOrder saleOrder) {
        SaleOrderResponse response = new SaleOrderResponse();
        response.setId(saleOrder.getId());
        response.setOrderNo(saleOrder.getOrderNo());
        response.setCustomerName(saleOrder.getCustomerName());
        response.setTotalAmount(saleOrder.getTotalAmount());
        response.setStatus(saleOrder.getStatus());
        response.setRemark(saleOrder.getRemark());
        response.setCreatedAt(saleOrder.getCreatedAt());
        response.setUpdatedAt(saleOrder.getUpdatedAt());

        List<SaleOrderItem> items = saleOrderItemMapper.selectList(
                new LambdaQueryWrapper<SaleOrderItem>()
                        .eq(SaleOrderItem::getSaleOrderId, saleOrder.getId())
        );

        List<SaleOrderItemResponse> itemResponses = items.stream()
                .map(this::toItemResponse)
                .toList();

        response.setItems(itemResponses);

        return response;
    }

    private SaleOrderItemResponse toItemResponse(SaleOrderItem item) {
        SaleOrderItemResponse response = new SaleOrderItemResponse();
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
    public PageResponse<SaleOrderResponse> pageList(String keyword, String status, long page, long size) {
        LambdaQueryWrapper<SaleOrder> wrapper = new LambdaQueryWrapper<>();

        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w.like(SaleOrder::getOrderNo, keyword)
                    .or()
                    .like(SaleOrder::getCustomerName, keyword));
        }

        if (status != null && !status.isBlank()) {
            try {
                SaleOrderStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                throw new BusinessException("销售单状态不合法");
            }

            wrapper.eq(SaleOrder::getStatus, status);
        }

        wrapper.orderByDesc(SaleOrder::getCreatedAt)
                .orderByDesc(SaleOrder::getId);

        Page<SaleOrder> saleOrderPage = new Page<>(page, size);
        Page<SaleOrder> result = saleOrderMapper.selectPage(saleOrderPage, wrapper);

        List<SaleOrderResponse> records = result.getRecords()
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

    private SaleOrderResponse toSimpleResponse(SaleOrder saleOrder) {
        SaleOrderResponse response = new SaleOrderResponse();
        response.setId(saleOrder.getId());
        response.setOrderNo(saleOrder.getOrderNo());
        response.setCustomerName(saleOrder.getCustomerName());
        response.setTotalAmount(saleOrder.getTotalAmount());
        response.setStatus(saleOrder.getStatus());
        response.setRemark(saleOrder.getRemark());
        response.setCreatedAt(saleOrder.getCreatedAt());
        response.setUpdatedAt(saleOrder.getUpdatedAt());
        return response;
    }

    @Override
    @Transactional
    public void approve(Long id) {
        SaleOrder saleOrder = saleOrderMapper.selectById(id);

        if (saleOrder == null) {
            throw new BusinessException("销售单不存在");
        }

        if (!SaleOrderStatus.DRAFT.name().equals(saleOrder.getStatus())) {
            throw new BusinessException("只有草稿状态的销售单可以审核");
        }

        List<SaleOrderItem> items = saleOrderItemMapper.selectList(
                new LambdaQueryWrapper<SaleOrderItem>()
                        .eq(SaleOrderItem::getSaleOrderId, id)
        );

        if (items.isEmpty()) {
            throw new BusinessException("销售单明细不能为空");
        }

        for (SaleOrderItem item : items) {
            Product product = productMapper.selectById(item.getProductId());

            if (product == null) {
                throw new BusinessException("商品不存在");
            }

            inventoryService.outbound(new InventoryChangeCommand(
                    item.getProductId(),
                    item.getQuantity(),
                    "SALE_ORDER",
                    saleOrder.getId(),
                    saleOrder.getOrderNo(),
                    "销售出库：" + saleOrder.getOrderNo()
            ));
        }

        int rows = saleOrderMapper.update(
                null,
                new LambdaUpdateWrapper<SaleOrder>()
                        .eq(SaleOrder::getId, id)
                        .eq(SaleOrder::getStatus, SaleOrderStatus.DRAFT.name())
                        .set(SaleOrder::getStatus, SaleOrderStatus.APPROVED.name())
        );

        if (rows == 0) {
            throw new BusinessException("销售单状态已变化，请刷新后重试");
        }
    }

    @Override
    @Transactional
    public void delete(Long id) {
        SaleOrder saleOrder = saleOrderMapper.selectById(id);

        if (saleOrder == null) {
            throw new BusinessException("销售单不存在");
        }

        if (!SaleOrderStatus.DRAFT.name().equals(saleOrder.getStatus())) {
            throw new BusinessException("只有草稿销售单可以删除");
        }

        saleOrderItemMapper.delete(
                new LambdaQueryWrapper<SaleOrderItem>()
                        .eq(SaleOrderItem::getSaleOrderId, id)
        );

        saleOrderMapper.deleteById(id);
    }

    @Override
    @Transactional
    public SaleOrderResponse update(Long id, SaleOrderCreateRequest request) {
        SaleOrder saleOrder = saleOrderMapper.selectById(id);

        if (saleOrder == null) {
            throw new BusinessException("销售单不存在");
        }


        if (!SaleOrderStatus.DRAFT.name().equals(saleOrder.getStatus())) {
            throw new BusinessException("只有草稿销售单可以修改");
        }


        saleOrder.setCustomerName(request.getCustomerName());
        saleOrder.setRemark(request.getRemark());

        saleOrderItemMapper.delete(
                new LambdaQueryWrapper<SaleOrderItem>()
                        .eq(SaleOrderItem::getSaleOrderId, id)
        );

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (SaleOrderItemRequest itemRequest : request.getItems()) {
            Product product = productMapper.selectById(itemRequest.getProductId());

            if (product == null) {
                throw new BusinessException("商品不存在");
            }

            if (product.getStock() < itemRequest.getQuantity()) {
                throw new BusinessException("商品库存不足：" + product.getName());
            }

            BigDecimal amount = itemRequest.getPrice()
                    .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            SaleOrderItem item = new SaleOrderItem();
            item.setSaleOrderId(saleOrder.getId());
            item.setProductId(product.getId());
            item.setProductCode(product.getProductCode());
            item.setProductName(product.getName());
            item.setQuantity(itemRequest.getQuantity());
            item.setPrice(itemRequest.getPrice());
            item.setAmount(amount);

            saleOrderItemMapper.insert(item);

            totalAmount = totalAmount.add(amount);
        }

        saleOrder.setTotalAmount(totalAmount);
        saleOrderMapper.updateById(saleOrder);

        return getById(id);


    }

    @Override
    @Transactional
    public void cancel(Long id) {
        SaleOrder saleOrder = saleOrderMapper.selectById(id);

        if (saleOrder == null) {
            throw new BusinessException("销售单不存在");
        }

        if (!SaleOrderStatus.APPROVED.name().equals(saleOrder.getStatus())) {
            throw new BusinessException("只有已审核销售单可以取消");
        }

        int rows = saleOrderMapper.update(
                null,
                new LambdaUpdateWrapper<SaleOrder>()
                        .eq(SaleOrder::getId, id)
                        .eq(SaleOrder::getStatus, SaleOrderStatus.APPROVED.name())
                        .set(SaleOrder::getStatus, SaleOrderStatus.CANCELED.name())
        );

        if (rows == 0) {
            throw new BusinessException("销售单状态已变化，请刷新后重试");
        }

        List<SaleOrderItem> items = saleOrderItemMapper.selectList(
                new LambdaQueryWrapper<SaleOrderItem>()
                        .eq(SaleOrderItem::getSaleOrderId, id)
        );

        if (items.isEmpty()) {
            throw new BusinessException("销售单明细不能为空");
        }

        for (SaleOrderItem item : items) {
            Product product = productMapper.selectById(item.getProductId());

            if (product == null) {
                throw new BusinessException("商品不存在");
            }

            inventoryService.inbound(new InventoryChangeCommand(
                    item.getProductId(),
                    item.getQuantity(),
                    "SALE_ORDER_CANCEL",
                    saleOrder.getId(),
                    saleOrder.getOrderNo(),
                    "销售取消入库：" + saleOrder.getOrderNo()
            ));
        }
    }
}