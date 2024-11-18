import { getClientInfo, handleCallback } from '@/utils/auth';
import { Button, Card, Descriptions, Message, Space, Spin } from '@arco-design/web-react';
import { IconCheckCircle } from '@arco-design/web-react/icon';
import React, { useEffect, useState } from 'react';
import { history, useSearchParams } from 'umi';

interface ClientInfo {
  clientId: string;
  clientName: string;
  clientType: string;
  scope: string;
  redirectUri: string;
  ownerId: string;
  [key: string]: any;
}

const AuthorizePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [client, setClient] = useState([]);
  const [code, setCode] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);

  useEffect(() => {
    console.log('AuthorizePage');
    const loadData = async () => {
      try {
        // 从 URL 获取参数
        const params = new URLSearchParams(window.location.search);
        const authCode = searchParams.get('code');
        const authState = searchParams.get('state');
        const clientId = searchParams.get('client_id');
        console.log('Auth Code:', authCode);

        if (!authCode) {
          Message.error('未获取到授权码');
          history.push('/login');
          return;
        }

        setCode(authCode);
        setState(authState);

        // 获取客户端信息
        if (clientId) {
          const info = await getClientInfo(clientId);
          setClientInfo(info);

          const client = [
            {
              label: '应用名称',
              value: info.clientName,
            },
            {
              label: '应用详情',
              value: info.clientDesc,
            },
            {
              label: '客户端权限',
              value: info.scope,
            },
          ];

          setClient(client);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        Message.error('获取客户端信息失败');
      }
    };

    loadData();
  }, []);

  const handleAuthorize = async () => {
    if (!code) {
      Message.error('未获取到授权码');
      return;
    }

    try {
      setLoading(true);
      // 使用授权码获取令牌
      const result = await handleCallback(code);
      console.log('获取令牌成功:', result);

      Message.success({
        content: '授权成功',
        duration: 2000,
      });

      // 如果有 state 参数，需要验证
      if (state) {
        // TODO: 验证 state 参数，防止 CSRF 攻击
      }

      // 如果客户端信息中有回调地址，使用它
      if (clientInfo?.redirectUri) {
        // 构建回调 URL，可以添加必要的参数
        const callbackUrl = new URL(clientInfo.redirectUri);
        callbackUrl.searchParams.append('token', result.access_token);
        if (result.refresh_token) {
          callbackUrl.searchParams.append('refresh_token', result.refresh_token);
        }
        
        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          window.location.href = callbackUrl.toString();
        }, 2000);
      } else {
        // 没有回调地址，跳转到默认页面
        setTimeout(() => {
          history.push('/');
        }, 2000);
      }
    } catch (error) {
      console.error('授权失败:', error);
      Message.error({
        content: '授权失败，请重试',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Message.info('已取消授权');
    history.push('/login');
  };

  if (!clientInfo) {
    return (
      <div style={{ 
        width: '100%',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <Spin dot size={40} tip="加载中..." />
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Card style={{ width: 600, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <IconCheckCircle style={{ fontSize: 48, color: 'rgb(var(--primary-6))' }} />
          <h2 style={{ margin: '16px 0' }}>授权确认</h2>
        </div>

        <Descriptions
          column={1}
          title="应用信息"
          style={{ marginBottom: 24 }}
          labelStyle={{ width: 100 }}
          data={client}
        >
        </Descriptions>

        <div style={{ marginTop: 24 }}>
          <p style={{ color: 'var(--color-text-2)', marginBottom: 16 }}>
            该应用请求访问以上信息，是否同意授权？
          </p>

          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              long
              loading={loading}
              onClick={handleAuthorize}
            >
              确认授权
            </Button>
            <Button
              type="text"
              long
              onClick={handleCancel}
              disabled={loading}
            >
              取消
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default AuthorizePage;