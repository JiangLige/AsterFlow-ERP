package com.asterflow.erp.common;

public final class EnumValidator {

    private EnumValidator() {
    }

    public static <E extends Enum<E>> String requireValid(
            Class<E> enumType,
            String value,
            String message
    ) {
        if (value == null || value.isBlank()) {
            return value;
        }

        try {
            return Enum.valueOf(enumType, value).name();
        } catch (IllegalArgumentException e) {
            throw new BusinessException(message);
        }
    }
}