import { history } from 'umi';
import { authGuard } from '@/utils/authGuard';

// 运行时配置
export function onRouteChange({ location, action }) {
  // 每次路由变化时执行
  console.log('路由变化:', location.pathname);
  
  // 白名单路径,这些路径不需要验证登录
  const whitelist = ['/login', '/callback', '/authorize'];
  
  // 如果不在白名单中,则验证登录状态
  if (!whitelist.includes(location.pathname)) {
    const isAuthenticated = authGuard(location.pathname);
    if (!isAuthenticated) {
      // 未登录则跳转到登录页
      console.log('未登录,跳转到登录页');
      history.push('/login');
      return;
    }
  }
}

// 修改交给 react-dom 渲染时的根组件配置
export function rootContainer(container) {
  return container;
}