// src/pages/callback/index.tsx
import { getClientInfo, handleCallback } from '@/utils/auth';
import { Message, Spin } from '@arco-design/web-react';
import React, { useEffect } from 'react';
import { history, useSearchParams } from 'umi';

const CallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // 获取授权码和状态
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code) {
          Message.error('未获取到授权码');
          history.push('/login');
          return;
        }

        // 验证 state（如果有）
        if (state) {
          // TODO: 验证 state 参数，防止 CSRF 攻击
        }

        // 使用授权码获取令牌
        const result = await handleCallback(code);
        console.log('获取令牌成功:', result);

        // 存储令牌
        if (result.access_token) {
          Message.success({
            content: '授权成功',
            duration: 2000,
          });

          // 跳转到首页或其他页面
          setTimeout(() => {
            history.push('/');
          }, 2000);
        }
      } catch (error) {
        console.error('授权回调处理失败:', error);
        Message.error('授权失败，请重试');
        history.push('/login');
      }
    };

    handleOAuthCallback();
  }, [searchParams]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <Spin tip="正在处理授权..." />
    </div>
  );
};

export default CallbackPage;