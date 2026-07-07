package com.asterflow.erp.service;

import com.asterflow.erp.dto.inventory.InventoryChangeCommand;

public interface InventoryService {

    void inbound(InventoryChangeCommand command);

    void outbound(InventoryChangeCommand command);

    void adjust(InventoryChangeCommand command);


}