import { Link, useLocation } from 'react-router-dom';
import { User } from '../types';

interface Props {
  user: User;
  onLogout: () => void;
}

const roleLabels: Record<string, string> = {
  passenger: '乘客',
  staff: '客服',
  admin: '管理员',
};

export default function Header({ user, onLogout }: Props) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <header className="app-header">
      <h1>城市公交投诉反馈平台</h1>
      <div className="header-right">
        <span>{user.username}</span>
        <span className="role-badge">{roleLabels[user.role] || user.role}</span>
        <nav className="nav-links">
          {user.role === 'passenger' && (
            <>
              <Link to="/submit" className={isActive('/submit')}>提交投诉</Link>
              <Link to="/my-tickets" className={isActive('/my-tickets')}>我的工单</Link>
            </>
          )}
          {user.role === 'staff' && (
            <Link to="/staff" className={isActive('/staff')}>工单处理</Link>
          )}
          {user.role === 'admin' && (
            <Link to="/admin" className={isActive('/admin')}>统计后台</Link>
          )}
          <button onClick={onLogout}>退出</button>
        </nav>
      </div>
    </header>
  );
}
