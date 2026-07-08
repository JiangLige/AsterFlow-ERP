package com.asterflow.erp.service.impl;

import com.asterflow.erp.mapper.AuditLogMapper;
import com.asterflow.erp.service.AuditLogService;
import com.asterflow.erp.entity.AuditLog;
import org.springframework.stereotype.Service;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.asterflow.erp.dto.AuditLogResponse;
import com.asterflow.erp.dto.PageResponse;

import java.util.List;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogMapper auditLogMapper;

    public AuditLogServiceImpl(AuditLogMapper auditLogMapper) {
        this.auditLogMapper = auditLogMapper;
    }

    @Override
    public void record(
            Long operatorId,
            String operatorName,
            String operatorRole,
            String action,
            String targetType,
            Long targetId,
            String targetNo,
            String description
    ) {
        AuditLog auditLog = new AuditLog();
        auditLog.setOperatorId(operatorId);
        auditLog.setOperatorName(operatorName);
        auditLog.setOperatorRole(operatorRole);
        auditLog.setAction(action);
        auditLog.setTargetType(targetType);
        auditLog.setTargetId(targetId);
        auditLog.setTargetNo(targetNo);
        auditLog.setDescription(description);

        auditLogMapper.insert(auditLog);
    }

    @Override
    public PageResponse<AuditLogResponse> pageList(
            String keyword,
            String action,
            String targetType,
            long page,
            long size
    ) {
        LambdaQueryWrapper<AuditLog> wrapper = new LambdaQueryWrapper<>();

        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w.like(AuditLog::getOperatorName, keyword)
                    .or()
                    .like(AuditLog::getTargetNo, keyword)
                    .or()
                    .like(AuditLog::getDescription, keyword));
        }

        if (action != null && !action.isBlank()) {
            wrapper.eq(AuditLog::getAction, action);
        }

        if (targetType != null && !targetType.isBlank()) {
            wrapper.eq(AuditLog::getTargetType, targetType);
        }

        wrapper.orderByDesc(AuditLog::getCreatedAt)
                .orderByDesc(AuditLog::getId);

        Page<AuditLog> auditLogPage = new Page<>(page, size);
        Page<AuditLog> result = auditLogMapper.selectPage(auditLogPage, wrapper);

        List<AuditLogResponse> records = result.getRecords()
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

    private AuditLogResponse toResponse(AuditLog auditLog) {
        AuditLogResponse response = new AuditLogResponse();

        response.setId(auditLog.getId());
        response.setOperatorId(auditLog.getOperatorId());
        response.setOperatorName(auditLog.getOperatorName());
        response.setOperatorRole(auditLog.getOperatorRole());
        response.setAction(auditLog.getAction());
        response.setTargetType(auditLog.getTargetType());
        response.setTargetId(auditLog.getTargetId());
        response.setTargetNo(auditLog.getTargetNo());
        response.setDescription(auditLog.getDescription());
        response.setCreatedAt(auditLog.getCreatedAt());

        return response;
    }
}