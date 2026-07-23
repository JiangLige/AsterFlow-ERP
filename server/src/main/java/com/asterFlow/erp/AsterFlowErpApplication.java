package com.asterFlow.erp;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@MapperScan("com.asterFlow.erp.mapper")
@SpringBootApplication
public class AsterFlowErpApplication {

    public static void main(String[] args) {
        SpringApplication.run(AsterFlowErpApplication.class, args);
    }
}
