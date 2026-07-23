package com.asterFlow.erp.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.asterFlow.erp.common.BusinessException;
import com.asterFlow.erp.dto.inventory.InventoryChangeCommand;
import com.asterFlow.erp.enums.StockChangeType;
import com.asterFlow.erp.mapper.ProductMapper;
import com.asterFlow.erp.mapper.StockRecordMapper;
import com.asterFlow.erp.service.DashboardCacheService;
import com.asterFlow.erp.service.InventoryService;
import entity.Product;
import entity.StockRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class InventoryServiceImpl implements InventoryService {

    private final ProductMapper productMapper;
    private final StockRecordMapper stockRecordMapper;
    private final DashboardCacheService dashboardCacheService;

    public InventoryServiceImpl(ProductMapper productMapper,
                                StockRecordMapper stockRecordMapper, DashboardCacheService dashboardCacheService) {
        this.productMapper = productMapper;
        this.stockRecordMapper = stockRecordMapper;
        this.dashboardCacheService = dashboardCacheService;
    }

    @Override
    public void inbound(InventoryChangeCommand command) {

        if (command == null) {
            throw new BusinessException("库存变化参数不能为空");
        }

        if (command.getQuantity() == null || command.getQuantity() <= 0) {
            throw new BusinessException("入库数量必须大于0");
        }

        if (command.getProductId() == null) {
            throw new BusinessException("商品ID不能为空");
        }

        Product product = productMapper.selectById(command.getProductId());

        if (product == null) {
            throw new BusinessException("商品不存在");
        }

        int beforeStock = product.getStock();
        int changeQuantity = command.getQuantity();
        int afterStock = beforeStock + changeQuantity;

        int rows = productMapper.update(
                null,
                new LambdaUpdateWrapper<Product>()
                        .eq(Product::getId, product.getId())
                        .setSql("stock = stock + " + changeQuantity)
        );

        if (rows == 0) {
            throw new BusinessException("商品库存更新失败：" + product.getName());
        }

        StockRecord stockRecord = new StockRecord();
        stockRecord.setProductId(product.getId());
        stockRecord.setProductCode(product.getProductCode());
        stockRecord.setProductName(product.getName());
        stockRecord.setChangeQuantity(changeQuantity);
        stockRecord.setBeforeStock(beforeStock);
        stockRecord.setAfterStock(afterStock);
        stockRecord.setType(StockChangeType.IN.name());
        stockRecord.setRemark(command.getRemark());
        stockRecord.setSourceType(command.getSourceType());
        stockRecord.setSourceId(command.getSourceId());
        stockRecord.setSourceNo(command.getSourceNo());

        stockRecordMapper.insert(stockRecord);
        dashboardCacheService.evictSummary();

    }

    @Override
    public void outbound(InventoryChangeCommand command) {

        if (command == null) {
            throw new BusinessException("库存变化参数不能为空");
        }

        if (command.getProductId() == null) {
            throw new BusinessException("商品ID不能为空");
        }

        if (command.getQuantity() == null || command.getQuantity() <= 0) {
            throw new BusinessException("出库数量必须大于0");
        }

        Product product = productMapper.selectById(command.getProductId());

        if (product == null) {
            throw new BusinessException("商品不存在");
        }

        int beforeStock = product.getStock();
        int changeQuantity = command.getQuantity();
        int afterStock = beforeStock - changeQuantity;

        if (afterStock < 0) {
            throw new BusinessException("商品库存不足：" + product.getName());
        }

        int rows = productMapper.update(
                null,
                new LambdaUpdateWrapper<Product>()
                        .eq(Product::getId, product.getId())
                        .ge(Product::getStock, changeQuantity)
                        .set(Product::getStock, afterStock)
        );

        if (rows == 0) {
            throw new BusinessException("商品库存不足：" + product.getName());
        }

        StockRecord stockRecord = new StockRecord();
        stockRecord.setProductId(product.getId());
        stockRecord.setProductCode(product.getProductCode());
        stockRecord.setProductName(product.getName());
        stockRecord.setChangeQuantity(-changeQuantity);
        stockRecord.setBeforeStock(beforeStock);
        stockRecord.setAfterStock(afterStock);
        stockRecord.setType(StockChangeType.OUT.name());
        stockRecord.setRemark(command.getRemark());
        stockRecord.setSourceType(command.getSourceType());
        stockRecord.setSourceId(command.getSourceId());
        stockRecord.setSourceNo(command.getSourceNo());

        stockRecordMapper.insert(stockRecord);
        dashboardCacheService.evictSummary();
    }

    @Override
    public void adjust(InventoryChangeCommand command) {
        if (command == null) {
            throw new BusinessException("库存变化参数不能为空");
        }

        if (command.getQuantity() == null) {
            throw new BusinessException("库存变化数量不能为空");
        }

        if (command.getQuantity() == 0) {
            throw new BusinessException("库存变化数量不能为0");
        }

        if (command.getQuantity() > 0) {
            inbound(command);
            return;
        }

        InventoryChangeCommand outboundCommand = new InventoryChangeCommand(
                command.getProductId(),
                Math.abs(command.getQuantity()),
                command.getSourceType(),
                command.getSourceId(),
                command.getSourceNo(),
                command.getRemark()
        );

        outbound(outboundCommand);
    }
}
