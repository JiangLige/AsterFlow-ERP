package com.asterflow.erp.common;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PageRequestUtilTest {

    @Test
    void normalizePageShouldUseOneWhenPageIsLessThanOne() {
        assertEquals(1, PageRequestUtil.normalizePage(0));
        assertEquals(1, PageRequestUtil.normalizePage(-5));
    }

    @Test
    void normalizePageShouldKeepValidPage() {
        assertEquals(2, PageRequestUtil.normalizePage(2));
    }

    @Test
    void normalizeSizeShouldUseDefaultWhenSizeIsLessThanOne() {
        assertEquals(10, PageRequestUtil.normalizeSize(0));
        assertEquals(10, PageRequestUtil.normalizeSize(-20));
    }

    @Test
    void normalizeSizeShouldLimitMaxSize() {
        assertEquals(100, PageRequestUtil.normalizeSize(101));
        assertEquals(100, PageRequestUtil.normalizeSize(999999));
    }

    @Test
    void normalizeSizeShouldKeepValidSize() {
        assertEquals(20, PageRequestUtil.normalizeSize(20));
    }
}