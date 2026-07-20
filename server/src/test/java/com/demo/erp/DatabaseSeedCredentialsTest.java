package com.demo.erp;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertTrue;

class DatabaseSeedCredentialsTest {

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Test
    void demoAccountsUseTheDocumentedPassword() throws IOException {
        String initSql = readInitSql();

        assertSeedPassword(initSql, "admin", "123456");
        assertSeedPassword(initSql, "staff", "123456");
    }

    private String readInitSql() throws IOException {
        try (InputStream input = getClass().getResourceAsStream("/db/init.sql")) {
            assertTrue(input != null, "db/init.sql must be available on the classpath");
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private void assertSeedPassword(String initSql, String username, String expectedPassword) {
        Matcher matcher = Pattern.compile("\\('" + Pattern.quote(username) + "',\\s*'([^']+)'", Pattern.MULTILINE)
                .matcher(initSql);

        assertTrue(matcher.find(), username + " seed account must exist");
        assertTrue(
                passwordEncoder.matches(expectedPassword, matcher.group(1)),
                username + " seed password must be " + expectedPassword
        );
    }
}
