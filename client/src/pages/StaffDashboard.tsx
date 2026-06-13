import { useEffect, useState } from 'react';
import { api } from '../api';
import { Complaint, ComplaintStatus, ComplaintType } from '../types';

const complaintTypes: ComplaintType[] = ['司机态度', '到站不准时', '车厢卫生', '站点设施损坏', '其他建议'];
const statusOptions: ComplaintStatus[] = ['待受理', '处理中', '已回复'];
const statusClass: Record<ComplaintStatus, string> = {
  '待受理': 'status-pending',
  '处理中': 'status-processing',
  '已回复': 'status-resolved',
};

export default function StaffDashboard() {
  const [tickets, setTickets] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterRoute, setFilterRoute] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [routes, setRoutes] = useState<string[]>([]);

  // 处理弹窗
  const [modal, setModal] = useState<Complaint | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('处理中');
  const [processLoading, setProcessLoading] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await api.getAllComplaints({
        type: filterType || undefined,
        route: filterRoute || undefined,
        status: filterStatus || undefined,
      }) as Complaint[];
      setTickets(data);
      // 提取所有线路
      const allRoutes = [...new Set(data.map(t => t.route))];
      setRoutes(allRoutes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, [filterType, filterRoute, filterStatus]);

  const openModal = (ticket: Complaint) => {
    setModal(ticket);
    setReplyText(ticket.reply || '');
    setNewStatus(ticket.status === '待受理' ? '处理中' : ticket.status);
  };

  const handleProcess = async () => {
    if (!modal) return;
    setProcessLoading(true);
    try {
      await api.processComplaint(modal.id, { status: newStatus, reply: replyText });
      setModal(null);
      loadTickets();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '操作失败');
    } finally {
      setProcessLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>客服工单处理</h2>

        <div className="filter-bar">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">全部类型</option>
            {complaintTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterRoute} onChange={e => setFilterRoute(e.target.value)}>
            <option value="">全部线路</option>
            {routes.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">全部状态</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ fontSize: 13, color: '#999' }}>共 {tickets.length} 条工单</span>
        </div>

        {loading ? (
          <p style={{ color: '#999' }}>加载中...</p>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <div className="icon">&#128203;</div>
            <p>暂无工单</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>工单号</th>
                  <th>乘客</th>
                  <th>类型</th>
                  <th>线路</th>
                  <th>站点</th>
                  <th>状态</th>
                  <th>提交时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{t.ticket_no}</td>
                    <td>{t.username}</td>
                    <td><span className="type-tag">{t.type}</span></td>
                    <td>{t.route}</td>
                    <td>{t.station}</td>
                    <td><span className={`status-tag ${statusClass[t.status]}`}>{t.status}</span></td>
                    <td style={{ fontSize: 13 }}>{t.created_at}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => openModal(t)}>
                        {t.status === '待受理' ? '受理' : '处理'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 处理弹窗 */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>处理工单 {modal.ticket_no}</h3>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#999' }}>乘客：{modal.username} | 线路：{modal.route} | 站点：{modal.station}</p>
              <p style={{ marginTop: 8, padding: 12, background: '#f9f9f9', borderRadius: 4, fontSize: 14 }}>{modal.description}</p>
            </div>
            <div className="form-group">
              <label>处理状态</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value as ComplaintStatus)}>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>处理意见</label>
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="请填写处理意见..." rows={4} />
            </div>
            <div className="modal-actions">
              <button className="btn" style={{ background: '#f0f0f0' }} onClick={() => setModal(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleProcess} disabled={processLoading}>
                {processLoading ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
