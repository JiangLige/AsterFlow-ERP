package com.asterFlow.erp.util;

import com.asterFlow.erp.common.BusinessException;
import com.asterFlow.erp.common.ErrorCode;
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
}
