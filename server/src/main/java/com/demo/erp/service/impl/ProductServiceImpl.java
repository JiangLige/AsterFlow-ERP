package com.demo.erp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.demo.erp.common.BusinessException;
import com.demo.erp.dto.*;
import com.demo.erp.dto.inventory.InventoryChangeCommand;
import com.demo.erp.enums.ProductStatus;
import com.demo.erp.enums.StockChangeType;
import com.demo.erp.mapper.ProductMapper;
import com.demo.erp.mapper.StockRecordMapper;
import com.demo.erp.service.AuditLogService;
import com.demo.erp.service.DashboardCacheService;
import com.demo.erp.service.InventoryService;
import com.demo.erp.service.ProductService;
import entity.Product;
import entity.StockRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductMapper productMapper;
    private final StockRecordMapper stockRecordMapper;
    private final InventoryService inventoryService;
    private final DashboardCacheService dashboardCacheService;
    private final AuditLogService auditLogService;

    public ProductServiceImpl(ProductMapper productMapper,
                              StockRecordMapper stockRecordMapper,
                              InventoryService inventoryService,
                              DashboardCacheService dashboardCacheService,
                              AuditLogService auditLogService) {
        this.productMapper = productMapper;
        this.stockRecordMapper = stockRecordMapper;
        this.inventoryService = inventoryService;
        this.dashboardCacheService = dashboardCacheService;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public ProductResponse create(ProductRequest request) {
        Long count = productMapper.selectCount(
                new LambdaQueryWrapper<Product>()
                        .eq(Product::getProductCode, request.getProductCode())
        );

        if (count > 0) {
            throw new BusinessException("商品编码已存在");
        }

        Product product = new Product();
        product.setProductCode(request.getProductCode());
        product.setName(request.getName());
        product.setCategory(request.getCategory());
        product.setUnit(request.getUnit());
        product.setPrice(request.getPrice());
        product.setCost(request.getCost());
        product.setStock(request.getStock());
        product.setStatus(ProductStatus.ACTIVE.name());
        product.setDescription(request.getDescription());
        product.setMinStock(request.getMinStock() == null ? 0 : request.getMinStock());

        productMapper.insert(product);
        dashboardCacheService.evictSummary();

        return toResponse(product);
    }

    @Override
    @Transactional
    public void active(Long id) {
        Product product = productMapper.selectById(id);

        if (product == null) {
            throw new BusinessException("商品不存在");
        }

        product.setStatus(ProductStatus.ACTIVE.name());

        productMapper.updateById(product);
        dashboardCacheService.evictSummary();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Product product = productMapper.selectById(id);

        if (product == null) {
            throw new BusinessException("商品不存在");
        }

        productMapper.deleteById(id);
        dashboardCacheService.evictSummary();
    }

    @Override
    @Transactional
    public void adjustStock(Long productId, StockAdjustRequest request) {
        adjustStockInternal(productId, request);
    }

    @Override
    @Transactional
    public void adjustStock(Long productId, StockAdjustRequest request, AuditOperator operator) {
        adjustStockInternal(productId, request);

        Product product = productMapper.selectById(productId);

        if (product == null) {
            throw new BusinessException("商品不存在");
        }

        auditLogService.record(
                operator.userId(),
                operator.username(),
                operator.role(),
                "STOCK_ADJUST",
                "PRODUCT",
                productId,
                product.getProductCode(),
                "手工调整商品库存，变化数量：" + request.getChangeQuantity()
        );
    }

    private void adjustStockInternal(Long productId, StockAdjustRequest request) {
        StockChangeType type;

        try {
            type = StockChangeType.valueOf(request.getType());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("库存变化类型不合法");
        }

        int changeQuantity = request.getChangeQuantity();

        if (changeQuantity == 0) {
            throw new BusinessException("库存变化数量不能为0");
        }

        if (type == StockChangeType.IN && changeQuantity < 0) {
            throw new BusinessException("入库数量必须大于0");
        }

        if (type == StockChangeType.OUT && changeQuantity > 0) {
            throw new BusinessException("出库数量必须小于0");
        }

        inventoryService.adjust(new InventoryChangeCommand(
                productId,
                changeQuantity,
                "MANUAL",
                null,
                null,
                request.getRemark()
        ));
    }

    @Override
    public List<ProductResponse> warningList() {
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();

        wrapper.apply("stock <= min_stock")
                .eq(Product::getStatus, ProductStatus.ACTIVE.name())
                .orderByAsc(Product::getStock);

        List<Product> products = productMapper.selectList(wrapper);

        return products.stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public PageResponse<StockRecordResponse> pageStockRecords(
            Long productId,
            String type,
            LocalDateTime startTime,
            LocalDateTime endTime,
            long page,
            long size) {
        Product product = productMapper.selectById(productId);

        if (product == null) {
            throw new BusinessException("商品不存在");
        }

        LambdaQueryWrapper<StockRecord> wrapper = new LambdaQueryWrapper<>();

        wrapper.eq(StockRecord::getProductId, productId);

        if (type != null && !type.isBlank()) {
            try {
                StockChangeType.valueOf(type);
            } catch (IllegalArgumentException e) {
                throw new BusinessException("库存变化类型不合法");
            }

            wrapper.eq(StockRecord::getType, type);
        }

        if (startTime != null) {
            wrapper.ge(StockRecord::getCreatedAt, startTime);
        }

        if (endTime != null) {
            wrapper.le(StockRecord::getCreatedAt, endTime);
        }

        wrapper.orderByDesc(StockRecord::getCreatedAt)
                .orderByDesc(StockRecord::getId);

        Page<StockRecord> stockRecordPage = new Page<>(page, size);

        Page<StockRecord> result = stockRecordMapper.selectPage(stockRecordPage, wrapper);

        List<StockRecordResponse> records = result.getRecords()
                .stream()
                .map(this::toStockRecordResponse)
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
    public ProductResponse getById(Long id) {
        Product product = productMapper.selectById(id);

        if (product == null) {
            throw new BusinessException("商品不存在");
        }

        return toResponse(product);
    }

    @Override
    public PageResponse<ProductResponse> pageList(String keyword, String status, long page, long size){
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();

        if (keyword != null && !keyword.isBlank()) {
            wrapper.like(Product::getProductCode, keyword)
                    .or()
                    .like(Product::getName, keyword)
                    .or()
                    .like(Product::getCategory, keyword);
        }

        if (status != null && !status.isBlank()) {
            wrapper.eq(Product::getStatus, status);
        }

        wrapper.orderByDesc(Product::getCreatedAt)
                .orderByDesc(Product::getId);

        Page<Product> productPage = new Page<>(page, size);

        Page<Product> result = productMapper.selectPage(productPage, wrapper);

        List<ProductResponse> records = result.getRecords()
                .stream()
                .map(this::toResponse)
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
    public ProductResponse update(Long id, ProductRequest request) {

        Product product = productMapper.selectById(id);

        if (product == null) {
            throw new BusinessException("商品不存在");
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                ProductStatus.valueOf(request.getStatus());
            } catch (IllegalArgumentException e) {
                throw new BusinessException("商品状态不合法");
            }
        }
        Product existing = productMapper.selectOne(
                new LambdaQueryWrapper<Product>()
                        .eq(Product::getProductCode, request.getProductCode())
        );

        if (existing != null && !existing.getId().equals(id)){
            throw new BusinessException("商品编码已存在");
        }


        product.setProductCode(request.getProductCode());
        product.setName(request.getName());
        product.setCategory(request.getCategory());
        product.setUnit(request.getUnit());
        product.setPrice(request.getPrice());
        product.setCost(request.getCost());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            product.setStatus(request.getStatus());
        }
        product.setDescription(request.getDescription());
        product.setMinStock(request.getMinStock() == null ? 0 : request.getMinStock());

        productMapper.updateById(product);
        dashboardCacheService.evictSummary();

        return toResponse(product);
    }

    @Override
    @Transactional
    public void inactive(Long id) {
        Product product = productMapper.selectById(id);

        if (product == null) {
            throw new BusinessException("商品不存在");
        }

        product.setStatus(ProductStatus.INACTIVE.name());

        productMapper.updateById(product);
        dashboardCacheService.evictSummary();
    }

    private ProductResponse toResponse(Product product) {
        ProductResponse response = new ProductResponse();

        response.setId(product.getId());
        response.setProductCode(product.getProductCode());
        response.setName(product.getName());
        response.setCategory(product.getCategory());
        response.setUnit(product.getUnit());
        response.setPrice(product.getPrice());
        response.setCost(product.getCost());
        response.setStock(product.getStock());
        response.setStatus(product.getStatus());
        response.setDescription(product.getDescription());
        response.setCreatedAt(product.getCreatedAt());
        response.setUpdatedAt(product.getUpdatedAt());
        response.setMinStock(product.getMinStock());

        return response;
    }

    private StockRecordResponse toStockRecordResponse(StockRecord stockRecord) {
        StockRecordResponse response = new StockRecordResponse();

        response.setId(stockRecord.getId());
        response.setProductId(stockRecord.getProductId());
        response.setProductCode(stockRecord.getProductCode());
        response.setProductName(stockRecord.getProductName());
        response.setChangeQuantity(stockRecord.getChangeQuantity());
        response.setBeforeStock(stockRecord.getBeforeStock());
        response.setAfterStock(stockRecord.getAfterStock());
        response.setType(stockRecord.getType());
        response.setRemark(stockRecord.getRemark());
        response.setCreatedAt(stockRecord.getCreatedAt());
        response.setSourceType(stockRecord.getSourceType());
        response.setSourceId(stockRecord.getSourceId());
        response.setSourceNo(stockRecord.getSourceNo());

        return response;
    }
}
