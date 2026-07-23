package com.asterFlow.erp.common;

import com.asterFlow.erp.mapper.OrderSequenceMapper;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
public class OrderNoGenerator {

    private final OrderSequenceMapper orderSequenceMapper;

    public OrderNoGenerator(OrderSequenceMapper orderSequenceMapper) {
        this.orderSequenceMapper = orderSequenceMapper;
    }

    @Transactional
    public String generate(String bizType) {
        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);

        orderSequenceMapper.nextValue(bizType, date);
        Integer sequence = orderSequenceMapper.getLastInsertId();

        return bizType + date + String.format("%04d", sequence);
    }
}