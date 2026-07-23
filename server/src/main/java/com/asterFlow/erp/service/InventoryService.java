package com.asterFlow.erp.service;

import com.asterFlow.erp.dto.inventory.InventoryChangeCommand;

public interface InventoryService {

    void inbound(InventoryChangeCommand command);

    void outbound(InventoryChangeCommand command);

    void adjust(InventoryChangeCommand command);


}