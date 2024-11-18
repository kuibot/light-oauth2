import { defineConfig } from 'umi';

export default defineConfig({
  https: {
    cert: './cert/server.crt',  // SSL证书
    key: './cert/server.key',   // SSL密钥
  },
  proxy: {
    '/oauth2/client': {
      target: 'https://localhost:6884',
      changeOrigin: true,
      secure: false,
      pathRewrite: { '^/oauth2/client': '/oauth2/client' },
      agent: false,
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('host', 'localhost:6884');
      },
      onProxyRes: (proxyRes, req, res) => {
        // 添加 CORS 头部
        res.setHeader('Access-Control-Allow-Origin', 'https://localhost:8000');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      },
      onError: (err, req, res) => {
        console.error('客户端服务代理错误:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('客户端服务请求失败: ' + err.message);
      },
    },
    '/oauth2/code': {
      target: 'https://localhost:6881',
      changeOrigin: true,
      secure: false,
      pathRewrite: { '^/oauth2/code': '/oauth2/code' },
      agent: false,
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('host', 'localhost:6881');
      },
      onProxyRes: (proxyRes, req, res) => {
        // 处理重定向
        if (proxyRes.headers.location) {
          const location = proxyRes.headers.location;
          if (location.startsWith('https://localhost:6881')) {
            proxyRes.headers.location = location.replace('https://localhost:6881', '');
          }
        }

        // 添加 CORS 头部
        res.setHeader('Access-Control-Allow-Origin', 'https://localhost:8000');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      },
      onError: (err, req, res) => {
        console.error('代理错误:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('代理请求失败: ' + err.message);
      },
    },
    '/oauth2/token': {
      target: 'https://localhost:6882',
      changeOrigin: true,
      secure: false,
      pathRewrite: { '^/oauth2/token': '/oauth2/token' },
      agent: false,
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('host', 'localhost:6882');
      },
      onProxyRes: (proxyRes, req, res) => {
        // 添加 CORS 头部
        res.setHeader('Access-Control-Allow-Origin', 'https://localhost:8000');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      },
      onError: (err, req, res) => {
        console.error('代理错误:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('代理请求失败: ' + err.message);
      },
    },
    '/_auth/authorize': {
      target: 'https://localhost:8888',
      changeOrigin: true,
      secure: false,
      pathRewrite: { '^/_auth/authorize': '/authorize' },
      agent: false,
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('host', 'localhost:6882');
      },
      onProxyRes: (proxyRes, req, res) => {
        // 添加 CORS 头部
        res.setHeader('Access-Control-Allow-Origin', 'https://localhost:8000');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      },
      onError: (err, req, res) => {
        console.error('代理错误:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('代理请求失败: ' + err.message);
      },
    },
  },
  npmClient: 'npm',
});