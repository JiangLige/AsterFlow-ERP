package com.asterflow.erp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.asterflow.erp.entity.Customer;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CustomerMapper extends BaseMapper<Customer> {
}
