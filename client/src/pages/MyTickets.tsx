import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Complaint, ComplaintStatus } from '../types';

const statusClass: Record<ComplaintStatus, string> = {
  '待受理': 'status-pending',
  '处理中': 'status-processing',
  '已回复': 'status-resolved',
};

export default function MyTickets() {
  const [tickets, setTickets] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [urgeLoadingId, setUrgeLoadingId] = useState<number | null>(null);

  useEffect(() => {
    api.getMyComplaints().then(data => {
      setTickets(data as Complaint[]);
      setLoading(false);
    });
  }, []);

  const handleUrge = async (ticket: Complaint) => {
    setUrgeLoadingId(ticket.id);
    try {
      const updated = await api.urgeComplaint(ticket.id) as Complaint;
      setTickets(prev => prev.map(t => t.id === ticket.id ? updated : t));
      alert('催办成功，请耐心等待处理');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '催办失败');
    } finally {
      setUrgeLoadingId(null);
    }
  };

  if (loading) return <div className="container"><p style={{ color: '#999' }}>加载中...</p></div>;

  return (
    <div className="container">
      <div className="card">
        <h2>我的工单</h2>
        {tickets.length === 0 ? (
          <div className="empty-state">
            <div className="icon">&#128203;</div>
            <p>暂无工单，<Link to="/submit">去提交投诉</Link></p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>工单号</th>
                  <th>类型</th>
                  <th>线路</th>
                  <th>状态</th>
                  <th>催办</th>
                  <th>满意度</th>
                  <th>提交时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{t.ticket_no}</td>
                    <td><span className="type-tag">{t.type}</span></td>
                    <td>{t.route}</td>
                    <td><span className={`status-tag ${statusClass[t.status]}`}>{t.status}</span></td>
                    <td>{t.urged ? <span className="status-tag" style={{ background: '#fff2e8', color: '#d4380d', border: '1px solid #ffbb96' }}>已催办</span> : '-'}</td>
                    <td>{t.rating ? `${t.rating} / 5` : '-'}</td>
                    <td style={{ fontSize: 13 }}>{t.created_at}</td>
                    <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Link to={`/ticket/${t.id}`}><button className="btn btn-primary btn-sm">查看</button></Link>
                      {!t.urged && (t.status === '待受理' || t.status === '处理中') && (
                        <button
                          className="btn btn-sm"
                          style={{ background: '#fff2e8', color: '#d4380d', border: '1px solid #ffbb96' }}
                          onClick={() => handleUrge(t)}
                          disabled={urgeLoadingId === t.id}
                        >
                          {urgeLoadingId === t.id ? '提交中...' : '催办'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
