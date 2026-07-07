package com.asterflow.erp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import entity.Customer;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CustomerMapper extends BaseMapper<Customer> {
}
