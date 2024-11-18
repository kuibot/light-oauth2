//package com.networknt.oauth.demo.handler;
//
//import com.networknt.handler.LightHttpHandler;
//import com.networknt.security.JwtVerifier;
//import com.networknt.security.SecurityConfig;
//import com.networknt.utility.Constants;
//import io.undertow.server.HttpServerExchange;
//import io.undertow.util.Headers;
//import io.undertow.util.StatusCodes;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import java.util.HashMap;
//import java.util.Map;
//
//public class UserInfoHandler implements LightHttpHandler {
//    private static final ObjectMapper mapper = new ObjectMapper();
//    private static final JwtVerifier jwtVerifier = new JwtVerifier(SecurityConfig.load("security.jwt"));
//
//    @Override
//    public void handleRequest(HttpServerExchange exchange) throws Exception {
//        try {
//            // 从请求头中获取 token
//            String authHeader = exchange.getRequestHeaders().getFirst(Headers.AUTHORIZATION);
//            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
//                exchange.setStatusCode(StatusCodes.UNAUTHORIZED);
//                exchange.getResponseSender().send("No valid authorization token found");
//                return;
//            }
//
//            String token = authHeader.substring(7); // 移除 "Bearer " 前缀
//            Map<String, Object> claims = jwtVerifier.verifyJwt(token, false);
//
//            // 从 JWT claims 中提取用户信息
//            Map<String, Object> userInfo = new HashMap<>();
//            userInfo.put("user_id", claims.get(Constants.USER_ID));
//            userInfo.put("username", claims.get("username"));
//            userInfo.put("email", claims.get("email"));
//            userInfo.put("scope", claims.get("scope"));
//
//            exchange.getResponseHeaders().put(Headers.CONTENT_TYPE, "application/json");
//            exchange.getResponseSender().send(mapper.writeValueAsString(userInfo));
//        } catch (Exception e) {
//            exchange.setStatusCode(StatusCodes.UNAUTHORIZED);
//            exchange.getResponseSender().send("Invalid token: " + e.getMessage());
//        }
//    }
//}