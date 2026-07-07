package com.asterflow.erp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.asterflow.erp.common.BusinessException;
import com.asterflow.erp.dto.PageResponse;
import com.asterflow.erp.dto.StockRecordResponse;
import com.asterflow.erp.enums.StockChangeType;
import com.asterflow.erp.mapper.StockRecordMapper;
import com.asterflow.erp.service.StockRecordService;
import entity.StockRecord;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class StockRecordServiceImpl implements StockRecordService {

    private final StockRecordMapper stockRecordMapper;

    public StockRecordServiceImpl(StockRecordMapper stockRecordMapper) {
        this.stockRecordMapper = stockRecordMapper;
    }

    @Override
    public PageResponse<StockRecordResponse> pageList(
            String keyword,
            String type,
            LocalDateTime startTime,
            LocalDateTime endTime,
            long page,
            long size) {

        LambdaQueryWrapper<StockRecord> wrapper = new LambdaQueryWrapper<>();

        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w.like(StockRecord::getProductCode, keyword)
                    .or()
                    .like(StockRecord::getProductName, keyword));
        }

        if (type != null && !type.isBlank()) {
            try {
                StockChangeType.valueOf(type);
            } catch (IllegalArgumentException e) {
                throw new BusinessException("库存变化类型不合");
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

    private StockRecordResponse toResponse(StockRecord stockRecord) {
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