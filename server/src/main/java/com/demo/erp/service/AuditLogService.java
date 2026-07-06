package com.demo.erp.service;

import com.demo.erp.dto.AuditLogResponse;
import com.demo.erp.dto.PageResponse;

public interface AuditLogService {

    void record(
            Long operatorId,
            String operatorName,
            String operatorRole,
            String action,
            String targetType,
            Long targetId,
            String targetNo,
            String description
    );

    PageResponse<AuditLogResponse> pageList(
            String keyword,
            String action,
            String targetType,
            long page,
            long size
    );
}