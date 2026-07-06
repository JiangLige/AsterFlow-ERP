package com.demo.erp.controller;

import com.demo.erp.common.ApiResponse;
import com.demo.erp.service.AiAssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@Tag(name = "AI 助手", description = "Spring AI 经营分析与库存建议接口")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    public AiAssistantController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    @GetMapping("/inventory-advice")
    @Operation(summary = "生成库存建议", description = "根据当前 ERP 看板数据和库存预警商品生成 AI 库存风险与补货建议")
    public ApiResponse<String> inventoryAdvice() {
        return ApiResponse.success(aiAssistantService.inventoryAdvice());
    }
}