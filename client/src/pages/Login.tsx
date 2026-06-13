import { useState } from 'react';
import { api } from '../api';
import { User } from '../types';

interface Props {
  onLogin: (token: string, user: User) => void;
}

export default function Login({ onLogin }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = tab === 'login' ? api.login : api.register;
      const res = await fn(username, password);
      onLogin(res.token, res.user as User);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="card">
          <div className="auth-tabs">
            <span className={tab === 'login' ? 'active' : ''} onClick={() => { setTab('login'); setError(''); }}>登录</span>
            <span className={tab === 'register' ? 'active' : ''} onClick={() => { setTab('register'); setError(''); }}>注册</span>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>用户名</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="请输入用户名" required />
            </div>
            <div className="form-group">
              <label>密码</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" required />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? '请稍候...' : tab === 'login' ? '登录' : '注册'}
            </button>
          </form>
          <p style={{ marginTop: 16, fontSize: 12, color: '#999', textAlign: 'center' }}>
            测试账号：passenger / staff / admin，密码均为 123456
          </p>
        </div>
      </div>
    </div>
  );
}
