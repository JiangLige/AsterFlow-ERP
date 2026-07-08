package com.asterflow.erp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.asterflow.erp.entity.OrderSequence;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface OrderSequenceMapper extends BaseMapper<OrderSequence> {

    @Update("""
        INSERT INTO t_order_sequence (biz_type, seq_date, current_value)
        VALUES (#{bizType}, #{seqDate}, LAST_INSERT_ID(1))
        ON DUPLICATE KEY UPDATE current_value = LAST_INSERT_ID(current_value + 1)
        """)
    void nextValue(@Param("bizType") String bizType,
                   @Param("seqDate") String seqDate);

    @Select("SELECT LAST_INSERT_ID()")
    Integer getLastInsertId();
}