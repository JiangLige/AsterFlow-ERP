INSERT INTO t_supplier
    (supplier_code, name, contact_name, phone, address, status, created_at, updated_at, deleted, version)
VALUES
    ('SUP-E2E', '端到端测试供应商', '测试联系人', '13800000001', '上海市', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0);

INSERT INTO t_customer
    (customer_code, name, contact_name, phone, address, status, created_at, updated_at, deleted)
VALUES
    ('CUS-E2E', '端到端测试客户', '测试联系人', '13900000001', '上海市', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

INSERT INTO t_product
    (product_code, name, category, unit, price, cost, stock, status, description, min_stock, version, created_at, updated_at, deleted)
VALUES
    ('P-1001', '无线扫码枪', '电子设备', '台', 299.00, 180.00, 25, 'ACTIVE', '端到端测试商品', 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

INSERT INTO t_order_sequence (biz_type, seq_date, current_value)
VALUES ('PO', FORMATDATETIME(CURRENT_DATE, 'yyyyMMdd'), 0),
       ('SO', FORMATDATETIME(CURRENT_DATE, 'yyyyMMdd'), 0);
