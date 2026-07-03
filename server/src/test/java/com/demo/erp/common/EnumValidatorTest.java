package com.demo.erp.common;

import com.demo.erp.enums.ProductStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EnumValidatorTest {

    @Test
    void requireValidShouldReturnEnumNameWhenValueIsValid() {
        String result = EnumValidator.requireValid(
                ProductStatus.class,
                "ACTIVE",
                "商品状态不合法"
        );

        assertEquals("ACTIVE", result);
    }

    @Test
    void requireValidShouldReturnOriginalValueWhenValueIsBlank() {
        assertEquals("", EnumValidator.requireValid(
                ProductStatus.class,
                "",
                "商品状态不合法"
        ));
    }

    @Test
    void requireValidShouldThrowBusinessExceptionWhenValueIsInvalid() {
        assertThrows(BusinessException.class, () ->
                EnumValidator.requireValid(
                        ProductStatus.class,
                        "UNKNOWN",
                        "商品状态不合法"
                )
        );
    }
}