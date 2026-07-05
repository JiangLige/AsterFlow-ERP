package com.demo.erp;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@MapperScan("com.demo.erp.mapper")
@SpringBootApplication
public class DemoErpApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoErpApplication.class, args);
    }
}
