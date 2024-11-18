package com.networknt.oauth.demo.handler;

import com.networknt.client.Http2Client;
import com.networknt.common.ContentType;
import com.networknt.config.Config;
import com.networknt.handler.LightHttpHandler;
import com.networknt.status.Status;
import io.undertow.UndertowOptions;
import io.undertow.client.ClientConnection;
import io.undertow.client.ClientRequest;
import io.undertow.client.ClientResponse;
import io.undertow.server.HttpServerExchange;
import io.undertow.util.Headers;
import io.undertow.util.Methods;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xnio.OptionMap;

import java.net.URI;
import java.util.Base64;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicReference;

/**
 * 处理从授权码到令牌的交换
 */
public class TokenExchangeHandler implements LightHttpHandler {
    private static final Logger logger = LoggerFactory.getLogger(TokenExchangeHandler.class);
    private static final String TOKEN_PATH = "/oauth2/token";
    private static final String CLIENT_ID = "f7d42348-c647-4efb-a52d-4c5787421e72";
    private static final String CLIENT_SECRET = "f6h1FTI8Q3-7UScPZDzfXA";
    private static final String OAUTH2_HOST = "https://localhost:6882";
    private static final String REDIRECT_URI = "https://localhost:8000/callback";
    private static final String SCOPE = "petstore.r petstore.w";  // 添加 scope

    @Override
    public void handleRequest(HttpServerExchange exchange) throws Exception {
        if (Methods.POST.equals(exchange.getRequestMethod())) {
            exchange.getRequestReceiver().receiveFullString((exchange1, message) -> {
                try {
                    // 解析请求中的授权码
                    String code = getCodeFromMessage(message);
                    if (code == null) {
                        Status status = new Status("ERR12008", "Invalid authorization code");
                        exchange1.setStatusCode(status.getStatusCode());
                        exchange1.getResponseSender().send(status.toString());
                        return;
                    }

                    // 准备访问 OAuth2 服务器
                    String tokenResponse = exchangeToken(code);

                    // 设置响应头
                    exchange1.getResponseHeaders().put(Headers.CONTENT_TYPE, ContentType.APPLICATION_JSON.value());
                    // 返回令牌响应
                    exchange1.getResponseSender().send(tokenResponse);
                } catch (Exception e) {
                    logger.error("Error processing token exchange", e);
                    Status status = new Status("ERR10010", e.getMessage());
                    exchange1.setStatusCode(status.getStatusCode());
                    exchange1.getResponseSender().send(status.toString());
                }
            });
        } else {
            exchange.setStatusCode(405);
            exchange.getResponseSender().send("Method not allowed");
        }
    }

    private String exchangeToken(String code) throws Exception {
        // 准备访问 OAuth2 服务器
        final Http2Client client = Http2Client.getInstance();
        final CountDownLatch latch = new CountDownLatch(1);
        final ClientConnection connection;
        try {
            connection = client.connect(new URI(OAUTH2_HOST), Http2Client.WORKER, Http2Client.SSL, Http2Client.BUFFER_POOL, OptionMap.create(UndertowOptions.ENABLE_HTTP2, true)).get();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        final AtomicReference<ClientResponse> reference = new AtomicReference<>();
        try {
            ClientRequest request = new ClientRequest().setPath(TOKEN_PATH).setMethod(Methods.POST);

            // 设置 Basic Auth
            String basicAuth = Base64.getEncoder().encodeToString((CLIENT_ID + ":" + CLIENT_SECRET).getBytes());
            request.getRequestHeaders()
                .put(Headers.AUTHORIZATION, "Basic " + basicAuth)
                .put(Headers.CONTENT_TYPE, "application/x-www-form-urlencoded")
                .put(Headers.TRANSFER_ENCODING, "chunked");

            // 构建请求体
            String customClaims = "{\"c1\":\"361\",\"c2\":\"67\"}";
            String requestBody = String.format(
                "grant_type=authorization_code&code=%s&redirect_uri=%s&scope=%s&custom_claim=%s",
                code, REDIRECT_URI, SCOPE, customClaims
            );

            // 发送请求
            connection.sendRequest(request, client.createClientCallback(reference, latch, requestBody));
            latch.await();

            int statusCode = reference.get().getResponseCode();
            if (statusCode != 200) {
                throw new Exception("Failed to exchange token with status code: " + statusCode);
            }

            // 获取响应
            String responseBody = reference.get().getAttachment(Http2Client.RESPONSE_BODY);
            if (responseBody == null || responseBody.trim().isEmpty()) {
                throw new Exception("Empty response from token endpoint");
            }

            return responseBody;
        } catch (Exception e) {
            logger.error("Error exchanging token:", e);
            throw e;
        } finally {
            // 关闭连接
            if(connection != null) {
                connection.getIoThread().execute(() -> {
                    try {
                        connection.close();
                    } catch (Exception e) {
                        logger.error("Error closing connection:", e);
                    }
                });
            }
        }
    }

    // 从请求消息中提取授权码
    private String getCodeFromMessage(String message) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(message);
            return node.get("code").asText();
        } catch (Exception e) {
            logger.error("Error parsing code from message:", e);
            return null;
        }
    }
}