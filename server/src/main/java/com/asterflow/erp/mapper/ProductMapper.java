package com.asterflow.erp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import entity.Product;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ProductMapper extends BaseMapper<Product> {

    @Update("""
            UPDATE t_product
            SET stock = stock - #{quantity},
                updated_at = NOW()
            WHERE id = #{productId}
              AND stock >= #{quantity}
              AND deleted = 0
            """)
    int deductStockIfEnough(@Param("productId") Long productId,
                            @Param("quantity") Integer quantity);

    @Update("""
            UPDATE t_product
            SET stock = stock + #{quantity},
                updated_at = NOW()
            WHERE id = #{productId}
              AND deleted = 0
            """)
    int increaseStock(@Param("productId") Long productId,
                      @Param("quantity") Integer quantity);
}