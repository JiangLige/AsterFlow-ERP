package com.demo.erp;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OpenApiDocumentationTests {

    @LocalServerPort
    private int port;

    @Test
    void openApiDocsAreAvailableWithoutAuthentication() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/v3/api-docs"))
                .GET()
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"openapi\"");
        assertThat(response.body()).contains("\"title\":\"Demo ERP API\"");
        assertThat(response.body()).contains("\"bearerAuth\"");
        assertThat(response.body()).contains("\"type\":\"http\"");
    }

    @Test
    void productApiDocsUseBusinessFriendlyDescriptions() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/v3/api-docs"))
                .GET()
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"name\":\"商品管理\"");
        assertThat(response.body()).contains("\"summary\":\"新增商品\"");
        assertThat(response.body()).contains("\"summary\":\"分页查询商品\"");
        assertThat(response.body()).contains("\"summary\":\"调整商品库存\"");
        assertThat(response.body()).contains("\"description\":\"商品编码，业务唯一\"");
    }

    @Test
    void customerApiDocsUseBusinessFriendlyDescriptions() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/v3/api-docs"))
                .GET()
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"name\":\"客户管理\"");
        assertThat(response.body()).contains("\"summary\":\"新增客户\"");
        assertThat(response.body()).contains("\"summary\":\"分页查询客户\"");
        assertThat(response.body()).contains("\"summary\":\"编辑客户\"");
        assertThat(response.body()).contains("\"description\":\"客户编码，业务唯一\"");
    }

    @Test
    void supplierApiDocsUseBusinessFriendlyDescriptions() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/v3/api-docs"))
                .GET()
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"name\":\"供应商管理\"");
        assertThat(response.body()).contains("\"summary\":\"新增供应商\"");
        assertThat(response.body()).contains("\"summary\":\"分页查询供应商\"");
        assertThat(response.body()).contains("\"summary\":\"启用供应商\"");
        assertThat(response.body()).contains("\"description\":\"供应商编码，业务唯一\"");
    }
}
