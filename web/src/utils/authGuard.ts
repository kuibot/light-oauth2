import { history } from 'umi';
import Cookies from 'js-cookie';
import { TOKEN_KEY } from './auth';

export function authGuard(path: string) {
  const token = Cookies.get(TOKEN_KEY);
  if (!token && path !== '/login') {
    history.push('/login');
    return false;
  }
  return true;
}