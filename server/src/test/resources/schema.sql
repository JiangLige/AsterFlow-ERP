DROP TABLE IF EXISTS t_audit_log;
DROP TABLE IF EXISTS t_stock_record;
DROP TABLE IF EXISTS t_sale_order_item;
DROP TABLE IF EXISTS t_sale_order;
DROP TABLE IF EXISTS t_purchase_order_item;
DROP TABLE IF EXISTS t_purchase_order;
DROP TABLE IF EXISTS t_order_sequence;
DROP TABLE IF EXISTS t_product;
DROP TABLE IF EXISTS t_supplier;
DROP TABLE IF EXISTS t_customer;
DROP TABLE IF EXISTS t_user;

CREATE TABLE t_user (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'STAFF',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT NOT NULL DEFAULT 0,
    version INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_username (username)
);

CREATE TABLE t_customer (
    id BIGINT NOT NULL AUTO_INCREMENT,
    customer_code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    contact_name VARCHAR(50),
    phone VARCHAR(30),
    address VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_customer_code (customer_code)
);

CREATE TABLE t_supplier (
    id BIGINT NOT NULL AUTO_INCREMENT,
    supplier_code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    contact_name VARCHAR(50),
    phone VARCHAR(30),
    address VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT NOT NULL DEFAULT 0,
    version INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_supplier_code (supplier_code)
);

CREATE TABLE t_product (
    id BIGINT NOT NULL AUTO_INCREMENT,
    product_code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    description VARCHAR(500),
    min_stock INT NOT NULL DEFAULT 0,
    version INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_product_code (product_code)
);

CREATE TABLE t_order_sequence (
    id BIGINT NOT NULL AUTO_INCREMENT,
    biz_type VARCHAR(20) NOT NULL,
    seq_date CHAR(8) NOT NULL,
    current_value INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_order_sequence_biz_date (biz_type, seq_date)
);

CREATE TABLE t_purchase_order (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_no VARCHAR(50) NOT NULL,
    supplier_id BIGINT NOT NULL,
    supplier_name VARCHAR(100) NOT NULL,
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    remark VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT NOT NULL DEFAULT 0,
    version INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_purchase_order_no (order_no)
);

CREATE TABLE t_purchase_order_item (
    id BIGINT NOT NULL AUTO_INCREMENT,
    purchase_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
);

CREATE TABLE t_sale_order (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_no VARCHAR(50) NOT NULL,
    customer_id BIGINT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    remark VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT NOT NULL DEFAULT 0,
    version INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_sale_order_no (order_no)
);

CREATE TABLE t_sale_order_item (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sale_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE t_stock_record (
    id BIGINT NOT NULL AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    change_quantity INT NOT NULL,
    before_stock INT NOT NULL,
    after_stock INT NOT NULL,
    type VARCHAR(20) NOT NULL,
    remark VARCHAR(500),
    source_type VARCHAR(50),
    source_id BIGINT,
    source_no VARCHAR(50),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE t_audit_log (
    id BIGINT NOT NULL AUTO_INCREMENT,
    operator_id BIGINT,
    operator_name VARCHAR(100),
    operator_role VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id BIGINT,
    target_no VARCHAR(100),
    description VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
