package com.asterflow.erp.common;

public final class PageRequestUtil {

    private static final long DEFAULT_PAGE = 1;
    private static final long DEFAULT_SIZE = 10;
    private static final long MAX_SIZE = 100;

    private PageRequestUtil() {
    }

    public static long normalizePage(long page) {
        return page < 1 ? DEFAULT_PAGE : page;
    }

    public static long normalizeSize(long size) {
        if (size < 1) {
            return DEFAULT_SIZE;
        }

        return Math.min(size, MAX_SIZE);
    }
}