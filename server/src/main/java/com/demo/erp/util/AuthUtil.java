package com.demo.erp.util;

import com.demo.erp.common.BusinessException;
import com.demo.erp.common.ErrorCode;
import com.demo.erp.dto.AuditOperator;
import jakarta.servlet.http.HttpServletRequest;

public class AuthUtil {

    private AuthUtil() {
    }

    public static void requireAdmin(HttpServletRequest request) {
        String role = (String) request.getAttribute("role");

        if (!"ADMIN".equals(role)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权限操作");
        }
    }

    public static AuditOperator currentOperator(HttpServletRequest request) {
        return new AuditOperator(
                (Long) request.getAttribute("userId"),
                (String) request.getAttribute("username"),
                (String) request.getAttribute("role")
        );
    }
}
