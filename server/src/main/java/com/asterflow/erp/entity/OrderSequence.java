package com.asterflow.erp.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("t_order_sequence")
public class OrderSequence {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private String bizType;
    private String seqDate;
    private Integer currentValue;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBizType() {
        return bizType;
    }

    public void setBizType(String bizType) {
        this.bizType = bizType;
    }

    public String getSeqDate() {
        return seqDate;
    }

    public void setSeqDate(String seqDate) {
        this.seqDate = seqDate;
    }

    public Integer getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(Integer currentValue) {
        this.currentValue = currentValue;
    }

}