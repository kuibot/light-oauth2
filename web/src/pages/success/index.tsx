import React from 'react';
import { Result, Button } from '@arco-design/web-react';
import { history, useSearchParams } from 'umi';
import styles from './index.less';

const SuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');

  const handleBack = () => {
    history.push('/login');
  };

  return (
    <div className={styles.container}>
      <Result
        status="success"
        title="授权成功"
        subTitle={
          <>
            <p>授权码：{code}</p>
            <p>您已成功授权应用访问您的账户</p>
          </>
        }
        extra={[
          <Button key="back" type="primary" onClick={handleBack}>
            返回首页
          </Button>,
        ]}
      />
    </div>
  );
};

export default SuccessPage;
