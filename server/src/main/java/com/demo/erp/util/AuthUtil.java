package com.demo.erp.util;

import com.demo.erp.common.BusinessException;
import jakarta.servlet.http.HttpServletRequest;

public class AuthUtil {

    private AuthUtil() {
    }

    public static void requireAdmin(HttpServletRequest request) {
        String role = (String) request.getAttribute("role");

        if (!"ADMIN".equals(role)) {
            throw new BusinessException("无权限操作");
        }
    }
}