import Cookies from 'js-cookie';

// Cookie keys
export const TOKEN_KEY = 'oauth_token';
const USER_KEY = 'oauth_user';

// OAuth2 配置
export const oauth2Config = {
  clientId: 'f7d42348-c647-4efb-a52d-4c5787421e72',
  responseType: 'code',
  redirectUri: 'https://localhost:8000/callback',
  serverUrl: 'https://localhost:6882',  // OAuth2 服务器地址
  tokenUrl: '/_auth/authorize',  // Token 交换端点
  scope: 'petstore.r petstore.w',
};

// Token 相关操作
export const getToken = () => Cookies.get(TOKEN_KEY);
export const setToken = (token: string) => Cookies.set(TOKEN_KEY, token);
export const removeToken = () => Cookies.remove(TOKEN_KEY);

// User 相关操作
export const getUser = () => {
  const user = Cookies.get(USER_KEY);
  return user ? JSON.parse(user) : null;
};
export const setUser = (user: any) => Cookies.set(USER_KEY, JSON.stringify(user));
export const removeUser = () => Cookies.remove(USER_KEY);

// 清除所有认证信息
export const clearAuth = () => {
  removeToken();
  removeUser();
};

// 处理登录请求
export const handleLogin = async (values: { username: string; password: string; }) => {
  try {
    // 构建认证参数
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: oauth2Config.clientId,
      redirect_uri: oauth2Config.redirectUri,
      scope: oauth2Config.scope,  // 可选的 scope
      state: Math.random().toString(36).substring(7),  // 防止 CSRF
      user_type: 'admin',  // 用户类型
      username: values.username,  // 用户名
      password: values.password,  // 密码
    });

    console.log('获取授权码...');
    // 使用代理URL
    const loginPageUrl = `/oauth2/code?${params.toString()}`;
    
    console.log('请求URL:', loginPageUrl);

    // 先发送 OPTIONS 请求检查 CORS
    const optionsResponse = await fetch(loginPageUrl, {
      method: 'OPTIONS',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'content-type,x-requested-with',
      },
    });

    console.log('OPTIONS 响应:', {
      status: optionsResponse.status,
      headers: Object.fromEntries(optionsResponse.headers),
    });

    // 发送实际请求
    const response = await fetch(loginPageUrl, {
      method: 'GET',
      credentials: 'include',
      redirect: 'follow',  // 让浏览器自动处理重定向
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    console.log('认证响应:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      url: response.url,
      type: response.type,
      ok: response.ok,
    });

    // 如果响应是重定向或包含授权码
    if (response.type === 'opaqueredirect' || response.url.includes('code=')) {
      // 获取最终URL
      const finalUrl = response.url;
      console.log('最终URL:', finalUrl);

      try {
        // 检查是否包含授权码
        const searchParams = new URLSearchParams(new URL(finalUrl).search);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        console.log('授权码:', code);

        if (code) {
          console.log('获取到授权码，跳转到回调页面');
          // 构建相对路径的回调 URL
          const callbackUrl = `/authorize?code=${code}&state=${state}&client_id=${oauth2Config.clientId}`;
          console.log('回调URL:', callbackUrl);
          window.location.href = callbackUrl;
          return;
        } else if (finalUrl.includes('/error')) {
          throw new Error('用户名或密码错误');
        } else {
          throw new Error('认证成功但未获取到授权码');
        }
      } catch (urlError) {
        console.error('解析URL失败:', urlError);
        throw new Error('处理认证响应失败');
      }
    }

    // 如果响应不是重定向
    if (!response.ok) {
      if (response.status === 0) {
        throw new Error('网络请求失败，请检查网络连接或服务器状态');
      }
      console.error('认证失败，状态码:', response.status);
      throw new Error(`认证失败，服务器返回状态码: ${response.status}`);
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;  // 直接抛出原始错误
    }
    console.error('Login error:', error);
    throw new Error('认证过程中发生未知错误');
  }
};

// 处理授权回调
// 处理授权回调
export async function handleCallback(code: string) {
  try {
    // 发送授权码到后端进行交换
    const response = await fetch('/_auth/authorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.description || 'Failed to exchange token');
    }

    const data = await response.json();
    
    // 存储令牌
    // 使用 cookie 存储令牌
    Cookies.set(TOKEN_KEY, data.access_token, { 
      expires: 7, // 7天过期
      secure: true, // 只在 HTTPS 下传输
      sameSite: 'strict' // 防止 CSRF 攻击
    });

    if (data.refresh_token) {
      Cookies.set('refresh_token', data.refresh_token, {
        expires: 30, // 30天过期
        secure: true,
        sameSite: 'strict'
      });
    }

    // 如果有用户信息,也存储到 cookie
    if (data.user) {
      Cookies.set(USER_KEY, JSON.stringify(data.user), {
        expires: 7,
        secure: true,
        sameSite: 'strict'
      });
    }

    return data;
  } catch (error) {
    console.error('Token exchange failed:', error);
    throw error;
  }
}

// 获取客户端信息
export const getClientInfo = async (clientId: string) => {
  try {
    const response = await fetch(`/oauth2/client/${clientId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      throw new Error(`获取客户端信息失败: ${response.status}`);
    }

    const clientInfo = await response.json();
    return clientInfo;
  } catch (error) {
    console.error('获取客户端信息失败:', error);
    throw error;
  }
};