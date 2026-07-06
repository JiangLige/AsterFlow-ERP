package com.demo.erp.service;

import com.demo.erp.dto.inventory.InventoryChangeCommand;

public interface InventoryService {

    void inbound(InventoryChangeCommand command);

    void outbound(InventoryChangeCommand command);

    void adjust(InventoryChangeCommand command);


}