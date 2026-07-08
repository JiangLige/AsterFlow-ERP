package com.asterflow.erp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.asterflow.erp.entity.AuditLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AuditLogMapper extends BaseMapper<AuditLog> {
}