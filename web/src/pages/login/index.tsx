import React from 'react';
import { Form, Input, Button, Message } from '@arco-design/web-react';
import { IconUser, IconLock } from '@arco-design/web-react/icon';
import { handleLogin } from '@/utils/auth';
import styles from './style.less';

const FormItem = Form.Item;

const LoginPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      await handleLogin(values);
      Message.success('认证成功，正在跳转...');
    } catch (error: any) {
      // 显示具体的错误信息
      const errorMessage = error.message || '登录失败';
      Message.error({
        content: errorMessage,
        duration: 3000,
      });
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.title}>Light OAuth2</div>
        <Form
          form={form}
          onSubmit={onFinish}
          layout="vertical"
          size="large"
          className={styles.form}
        >
          <FormItem
            field="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<IconUser />}
              placeholder="用户名"
              allowClear
            />
          </FormItem>
          <FormItem
            field="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<IconLock />}
              placeholder="密码"
              allowClear
            />
          </FormItem>
          <FormItem>
            <Button type="primary" htmlType="submit" loading={loading} long>
              登录
            </Button>
          </FormItem>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;