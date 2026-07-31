package com.asterFlow.erp.dto;

import java.util.List;

public class PageResponse<T> {

        private List<T> records;
        private long total;
        private long page;
        private long size;
        private long pages;

    public void setRecords(List<T> records) {
        this.records = records;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public void setPage(long page) {
        this.page = page;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public void setPages(long pages) {
        this.pages = pages;
    }

    public PageResponse(List<T> records, long total, long page, long size, long pages) {
            this.records = records;
            this.total = total;
            this.page = page;
            this.size = size;
            this.pages = pages;
        }

        public List<T> getRecords() {
            return records;
        }

        public long getTotal() {
            return total;
        }

        public long getPage() {
            return page;
        }

        public long getSize() {
            return size;
        }

        public long getPages() {
            return pages;
        }
}
