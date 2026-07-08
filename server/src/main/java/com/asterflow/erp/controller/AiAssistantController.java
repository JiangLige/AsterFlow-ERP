package com.asterflow.erp.controller;

import com.asterflow.erp.common.ApiResponse;
import com.asterflow.erp.dto.ai.AiInventoryAdviceResponse;
import com.asterflow.erp.service.AiAssistantService;
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
    @Operation(summary = "生成库存建议", description = "根据当前 ERP 数据生成结构化 AI 库存建议")
    public ApiResponse<AiInventoryAdviceResponse> inventoryAdvice() {
        return ApiResponse.success(aiAssistantService.inventoryAdvice());
    }
}
