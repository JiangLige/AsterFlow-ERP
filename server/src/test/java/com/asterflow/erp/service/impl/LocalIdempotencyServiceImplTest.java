package com.asterflow.erp.service.impl;

import com.asterflow.erp.common.BusinessException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalIdempotencyServiceImplTest {

    @Test
    void shouldAllowFirstExecutionAndRejectDuplicateExecution() {
        LocalIdempotencyServiceImpl service = new LocalIdempotencyServiceImpl();

        service.requireFirstExecution("user-1:purchase-order:approve:100", "same-key");

        assertThatThrownBy(() ->
                service.requireFirstExecution("user-1:purchase-order:approve:100", "same-key")
        )
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("请勿重复提交");
    }

    @Test
    void shouldAllowDifferentIdempotencyKeys() {
        LocalIdempotencyServiceImpl service = new LocalIdempotencyServiceImpl();

        service.requireFirstExecution("user-1:purchase-order:approve:100", "key-1");
        service.requireFirstExecution("user-1:purchase-order:approve:100", "key-2");
    }

    @Test
    void shouldIgnoreBlankKey() {
        LocalIdempotencyServiceImpl service = new LocalIdempotencyServiceImpl();

        service.requireFirstExecution("user-1:sale-order:approve:200", "");
        service.requireFirstExecution("user-1:sale-order:approve:200", "");
        service.requireFirstExecution("user-1:sale-order:approve:200", null);
    }
}