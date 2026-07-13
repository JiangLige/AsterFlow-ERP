package com.asterflow.erp.e2e;

import com.asterflow.erp.entity.User;
import com.asterflow.erp.mapper.UserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
@Profile("e2e")
public class E2eDataConfiguration {

    @Bean
    ApplicationRunner resetE2eAdminPassword(
            UserMapper userMapper,
            BCryptPasswordEncoder passwordEncoder
    ) {
        return args -> {
            User admin = userMapper.selectOne(
                    new LambdaQueryWrapper<User>().eq(User::getUsername, "admin")
            );
            admin.setPassword(passwordEncoder.encode("admin123"));
            userMapper.updateById(admin);
        };
    }
}
