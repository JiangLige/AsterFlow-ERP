package com.demo.erp.service;

import com.demo.erp.dto.inventory.InventoryChangeCommand;
import com.demo.erp.common.EnumValidator;
import com.demo.erp.enums.CustomerStatus;

public interface InventoryService {

    void inbound(InventoryChangeCommand command);

    void outbound(InventoryChangeCommand command);

    void adjust(InventoryChangeCommand command);


}