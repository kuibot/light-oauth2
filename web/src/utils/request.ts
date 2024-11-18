import axios from 'axios';
import Cookies from 'js-cookie';
import { history } from 'umi';
import { message } from 'antd';
import { TOKEN_KEY } from './auth';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = Cookies.get(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // token 过期,尝试刷新
      try {
        const refreshToken = Cookies.get('refresh_token');
        if (refreshToken) {
          const res = await axios.post('/api/refresh', { refresh_token: refreshToken });
          Cookies.set(TOKEN_KEY, res.data.access_token);
          Cookies.set('refresh_token', res.data.refresh_token);
          
          // 重试原请求
          const config = error.config;
          config.headers.Authorization = `Bearer ${res.data.access_token}`;
          return axios(config);
        }
      } catch (e) {
        // 刷新失败,跳转登录
        message.error('登录已过期,请重新登录');
        history.push('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default request;