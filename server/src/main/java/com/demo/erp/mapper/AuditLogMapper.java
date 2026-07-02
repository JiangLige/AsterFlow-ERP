package com.demo.erp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import entity.AuditLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AuditLogMapper extends BaseMapper<AuditLog> {
}