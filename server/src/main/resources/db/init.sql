-- Demo ERP MySQL initialization script.
-- Target database configuration:
--   jdbc:mysql://localhost:3306/demo_erp?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8
--
-- Default accounts:
--   admin / admin123
--   staff / user123

CREATE DATABASE IF NOT EXISTS demo_erp
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE demo_erp;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS t_stock_record;
DROP TABLE IF EXISTS t_sale_order_item;
DROP TABLE IF EXISTS t_sale_order;
DROP TABLE IF EXISTS t_customer;
DROP TABLE IF EXISTS t_purchase_order_item;
DROP TABLE IF EXISTS t_purchase_order;
DROP TABLE IF EXISTS t_order_sequence;
DROP TABLE IF EXISTS t_product;
DROP TABLE IF EXISTS t_supplier;
DROP TABLE IF EXISTS t_user;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE t_user (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT 'BCrypt密码',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    role VARCHAR(20) NOT NULL DEFAULT 'STAFF' COMMENT '角色: ADMIN/STAFF',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE/INACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0未删除, 1已删除',
    version INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_username (username),
    KEY idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

CREATE TABLE t_supplier (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    supplier_code VARCHAR(50) NOT NULL COMMENT '供应商编码',
    name VARCHAR(100) NOT NULL COMMENT '供应商名称',
    contact_name VARCHAR(50) NULL COMMENT '联系人',
    phone VARCHAR(30) NULL COMMENT '联系电话',
    address VARCHAR(255) NULL COMMENT '地址',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE/INACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0未删除, 1已删除',
    version INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
    PRIMARY KEY (id),
    UNIQUE KEY uk_supplier_code (supplier_code),
    KEY idx_supplier_name (name),
    KEY idx_supplier_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='供应商表';

CREATE TABLE t_customer (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    customer_code VARCHAR(50) NOT NULL COMMENT '客户编码',
    name VARCHAR(100) NOT NULL COMMENT '客户名称',
    contact_name VARCHAR(50) NULL COMMENT '联系人',
    phone VARCHAR(30) NULL COMMENT '联系电话',
    address VARCHAR(255) NULL COMMENT '地址',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE/INACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0未删除, 1已删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_customer_code (customer_code),
    KEY idx_customer_name (name),
    KEY idx_customer_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户表';

CREATE TABLE t_product (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    product_code VARCHAR(50) NOT NULL COMMENT '商品编码',
    name VARCHAR(100) NOT NULL COMMENT '商品名称',
    category VARCHAR(50) NOT NULL COMMENT '商品分类',
    unit VARCHAR(20) NOT NULL COMMENT '单位',
    price DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '销售价',
    cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '成本价',
    stock INT NOT NULL DEFAULT 0 COMMENT '当前库存',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE/INACTIVE',
    description VARCHAR(500) NULL COMMENT '商品描述',
    min_stock INT NOT NULL DEFAULT 0 COMMENT '最低库存预警值',
    version INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0未删除, 1已删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_product_code (product_code),
    KEY idx_product_name (name),
    KEY idx_product_category (category),
    KEY idx_product_status (status),
    KEY idx_product_stock_warning (stock, min_stock),
    CONSTRAINT ck_product_price_non_negative CHECK (price >= 0),
    CONSTRAINT ck_product_cost_non_negative CHECK (cost >= 0),
    CONSTRAINT ck_product_stock_non_negative CHECK (stock >= 0),
    CONSTRAINT ck_product_min_stock_non_negative CHECK (min_stock >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

CREATE TABLE t_order_sequence (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    biz_type VARCHAR(20) NOT NULL COMMENT '业务类型: PO/SO等',
    seq_date CHAR(8) NOT NULL COMMENT '序号日期: yyyyMMdd',
    current_value INT NOT NULL DEFAULT 0 COMMENT '当前流水值',
    PRIMARY KEY (id),
    UNIQUE KEY uk_order_sequence_biz_date (biz_type, seq_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='单号流水表';

CREATE TABLE t_purchase_order (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    order_no VARCHAR(50) NOT NULL COMMENT '采购单号',
    supplier_id BIGINT NOT NULL COMMENT '供应商ID',
    supplier_name VARCHAR(100) NOT NULL COMMENT '供应商名称快照',
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00 COMMENT '总金额',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT '状态: DRAFT/APPROVED/CANCELED',
    remark VARCHAR(500) NULL COMMENT '备注',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0未删除, 1已删除',
    version INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
    PRIMARY KEY (id),
    UNIQUE KEY uk_purchase_order_no (order_no),
    KEY idx_purchase_order_supplier (supplier_id),
    KEY idx_purchase_order_status (status),
    KEY idx_purchase_order_created_at (created_at),
    CONSTRAINT fk_purchase_order_supplier FOREIGN KEY (supplier_id) REFERENCES t_supplier (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='采购订单表';

CREATE TABLE t_purchase_order_item (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    purchase_order_id BIGINT NOT NULL COMMENT '采购单ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    product_code VARCHAR(50) NOT NULL COMMENT '商品编码快照',
    product_name VARCHAR(100) NOT NULL COMMENT '商品名称快照',
    quantity INT NOT NULL COMMENT '采购数量',
    price DECIMAL(12, 2) NOT NULL COMMENT '采购单价',
    amount DECIMAL(14, 2) NOT NULL COMMENT '明细金额',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0未删除, 1已删除',
    PRIMARY KEY (id),
    KEY idx_purchase_item_order (purchase_order_id),
    KEY idx_purchase_item_product (product_id),
    CONSTRAINT fk_purchase_item_order FOREIGN KEY (purchase_order_id) REFERENCES t_purchase_order (id),
    CONSTRAINT fk_purchase_item_product FOREIGN KEY (product_id) REFERENCES t_product (id),
    CONSTRAINT ck_purchase_item_quantity_positive CHECK (quantity > 0),
    CONSTRAINT ck_purchase_item_price_positive CHECK (price > 0),
    CONSTRAINT ck_purchase_item_amount_non_negative CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='采购订单明细表';

CREATE TABLE t_sale_order (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    order_no VARCHAR(50) NOT NULL COMMENT '销售单号',
    customer_id BIGINT NOT NULL COMMENT '客户ID',
    customer_name VARCHAR(100) NOT NULL COMMENT '客户名称',
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00 COMMENT '总金额',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT '状态: DRAFT/APPROVED/CANCELED',
    remark VARCHAR(500) NULL COMMENT '备注',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0未删除, 1已删除',
    version INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
    PRIMARY KEY (id),
    UNIQUE KEY uk_sale_order_no (order_no),
    KEY idx_sale_order_customer_id (customer_id),
    KEY idx_sale_order_customer_name (customer_name),
    KEY idx_sale_order_status (status),
    KEY idx_sale_order_created_at (created_at),
    CONSTRAINT fk_sale_order_customer FOREIGN KEY (customer_id) REFERENCES t_customer (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='销售订单表';

CREATE TABLE t_sale_order_item (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    sale_order_id BIGINT NOT NULL COMMENT '销售单ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    product_code VARCHAR(50) NOT NULL COMMENT '商品编码快照',
    product_name VARCHAR(100) NOT NULL COMMENT '商品名称快照',
    quantity INT NOT NULL COMMENT '销售数量',
    price DECIMAL(12, 2) NOT NULL COMMENT '销售单价',
    amount DECIMAL(14, 2) NOT NULL COMMENT '明细金额',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_sale_item_order (sale_order_id),
    KEY idx_sale_item_product (product_id),
    CONSTRAINT fk_sale_item_order FOREIGN KEY (sale_order_id) REFERENCES t_sale_order (id),
    CONSTRAINT fk_sale_item_product FOREIGN KEY (product_id) REFERENCES t_product (id),
    CONSTRAINT ck_sale_item_quantity_positive CHECK (quantity > 0),
    CONSTRAINT ck_sale_item_price_positive CHECK (price > 0),
    CONSTRAINT ck_sale_item_amount_non_negative CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='销售订单明细表';

CREATE TABLE t_stock_record (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    product_code VARCHAR(50) NOT NULL COMMENT '商品编码快照',
    product_name VARCHAR(100) NOT NULL COMMENT '商品名称快照',
    change_quantity INT NOT NULL COMMENT '库存变化数量',
    before_stock INT NOT NULL COMMENT '变化前库存',
    after_stock INT NOT NULL COMMENT '变化后库存',
    type VARCHAR(20) NOT NULL COMMENT '库存变化类型: IN/OUT',
    remark VARCHAR(500) NULL COMMENT '备注',
    source_type VARCHAR(50) NULL COMMENT '来源类型',
    source_id BIGINT NULL COMMENT '来源单据ID',
    source_no VARCHAR(50) NULL COMMENT '来源单据号',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_stock_record_product (product_id),
    KEY idx_stock_record_type (type),
    KEY idx_stock_record_source (source_type, source_id),
    KEY idx_stock_record_created_at (created_at),
    CONSTRAINT fk_stock_record_product FOREIGN KEY (product_id) REFERENCES t_product (id),
    CONSTRAINT ck_stock_record_after_stock_non_negative CHECK (after_stock >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存流水表';

INSERT INTO t_user
    (username, password, real_name, role, status, created_at, updated_at, deleted, version)
VALUES
    ('admin', '$2a$10$6bszuJilQ5N3LJogrSyLE..aupUP3Neh6xvyTWwNJVzGI0uFK5tbC', '系统管理员', 'ADMIN', 'ACTIVE', NOW(), NOW(), 0, 0),
    ('staff', '$2a$10$CJk0YglGHQhCCEqgTReq8uqYk5QiVfPVQhiSq6T7Lcc227OfORTji', '业务员', 'STAFF', 'ACTIVE', NOW(), NOW(), 0, 0);

INSERT INTO t_supplier
    (supplier_code, name, contact_name, phone, address, status, created_at, updated_at, deleted, version)
VALUES
    ('SUP-001', '华东电子供应链有限公司', '张敏', '13800000001', '上海市浦东新区张江路88号', 'ACTIVE', NOW(), NOW(), 0, 0),
    ('SUP-002', '北方办公设备有限公司', '李强', '13800000002', '北京市海淀区中关村大街20号', 'ACTIVE', NOW(), NOW(), 0, 0),
    ('SUP-003', '南方仓储耗材有限公司', '王芳', '13800000003', '广州市天河区体育西路66号', 'INACTIVE', NOW(), NOW(), 0, 0);

INSERT INTO t_customer
    (customer_code, name, contact_name, phone, address, status, created_at, updated_at, deleted)
VALUES
    ('CUS-001', '上海零售客户有限公司', '陈晨', '13900000001', '上海市徐汇区漕溪北路18号', 'ACTIVE', NOW(), NOW(), 0),
    ('CUS-002', '杭州办公采购有限公司', '赵磊', '13900000002', '杭州市西湖区文三路88号', 'ACTIVE', NOW(), NOW(), 0),
    ('CUS-003', '广州渠道客户有限公司', '刘洋', '13900000003', '广州市天河区珠江新城66号', 'INACTIVE', NOW(), NOW(), 0);

INSERT INTO t_product
    (product_code, name, category, unit, price, cost, stock, status, description, min_stock, version, created_at, updated_at, deleted)
VALUES
    ('P-1001', '无线扫码枪', '电子设备', '台', 299.00, 180.00, 25, 'ACTIVE', '仓库出入库扫码设备', 10, 0, NOW(), NOW(), 0),
    ('P-1002', '热敏标签纸', '耗材', '卷', 18.00, 9.50, 120, 'ACTIVE', '80mm热敏标签纸', 50, 0, NOW(), NOW(), 0),
    ('P-1003', '蓝牙打印机', '电子设备', '台', 499.00, 320.00, 8, 'ACTIVE', '便携式蓝牙标签打印机', 10, 0, NOW(), NOW(), 0),
    ('P-1004', 'A4复印纸', '办公用品', '箱', 168.00, 120.00, 45, 'ACTIVE', '70g A4复印纸', 20, 0, NOW(), NOW(), 0);

INSERT INTO t_order_sequence
    (biz_type, seq_date, current_value)
VALUES
    ('PO', DATE_FORMAT(CURDATE(), '%Y%m%d'), 0),
    ('SO', DATE_FORMAT(CURDATE(), '%Y%m%d'), 0)
ON DUPLICATE KEY UPDATE current_value = VALUES(current_value);
