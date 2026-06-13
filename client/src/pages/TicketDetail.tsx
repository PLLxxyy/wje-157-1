import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { Complaint, ComplaintStatus, User } from '../types';

interface Props {
  user: User;
}

const statusSteps: ComplaintStatus[] = ['待受理', '处理中', '已回复'];

export default function TicketDetail({ user }: Props) {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getComplaintDetail(Number(id)).then(data => {
      setTicket(data as Complaint);
      setLoading(false);
    });
  }, [id]);

  const handleRate = async () => {
    if (!ticket || rating === 0) return;
    setRatingLoading(true);
    try {
      const updated = await api.rateComplaint(ticket.id, rating);
      setTicket(updated as Complaint);
      alert('评分成功！');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '评分失败');
    } finally {
      setRatingLoading(false);
    }
  };

  if (loading) return <div className="container"><p style={{ color: '#999' }}>加载中...</p></div>;
  if (!ticket) return <div className="container"><p>工单不存在</p></div>;

  const currentStep = statusSteps.indexOf(ticket.status);

  return (
    <div className="container">
      <div className="card">
        <h2>工单详情 - {ticket.ticket_no}</h2>

        {/* 进度条 */}
        <div className="progress-bar">
          {statusSteps.map((step, i) => (
            <div key={step} style={{ display: 'contents' }}>
              <div className="progress-step">
                <div className={`progress-dot ${i < currentStep ? 'done' : i === currentStep ? 'current' : ''}`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className={i <= currentStep ? 'active' : ''}>{step}</span>
              </div>
              {i < statusSteps.length - 1 && (
                <div className={`progress-line ${i < currentStep ? 'done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* 详情信息 */}
        <div style={{ marginBottom: 20 }}>
          <div className="detail-row">
            <span className="detail-label">投诉类型</span>
            <span className="detail-value"><span className="type-tag">{ticket.type}</span></span>
          </div>
          <div className="detail-row">
            <span className="detail-label">事发线路</span>
            <span className="detail-value">{ticket.route}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">事发站点</span>
            <span className="detail-value">{ticket.station}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">事发时间</span>
            <span className="detail-value">{ticket.incident_time}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">提交时间</span>
            <span className="detail-value">{ticket.created_at}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">当前状态</span>
            <span className="detail-value">
              <span className={`status-tag ${ticket.status === '待受理' ? 'status-pending' : ticket.status === '处理中' ? 'status-processing' : 'status-resolved'}`}>
                {ticket.status}
              </span>
            </span>
          </div>
        </div>

        <h3>问题描述</h3>
        <p style={{ background: '#f9f9f9', padding: 16, borderRadius: 6, marginBottom: 20, fontSize: 14, lineHeight: 1.8 }}>
          {ticket.description}
        </p>

        {/* 回复区域 */}
        {ticket.reply && (
          <div className="reply-section">
            <h4>客服回复</h4>
            <p>{ticket.reply}</p>
          </div>
        )}

        {/* 满意度评分（仅乘客，已回复且未评分） */}
        {user.role === 'passenger' && ticket.status === '已回复' && !ticket.rating && (
          <div style={{ marginTop: 24, padding: 16, background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}>
            <h3 style={{ marginBottom: 12 }}>请对本次处理结果评分</h3>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(i => (
                <span
                  key={i}
                  className={`star ${(hoverRating || rating) >= i ? 'active' : ''}`}
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  &#9733;
                </span>
              ))}
            </div>
            <p style={{ marginTop: 8, fontSize: 13, color: '#999' }}>{rating > 0 ? `${rating} 分` : '点击星星评分'}</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={handleRate} disabled={rating === 0 || ratingLoading}>
              {ratingLoading ? '提交中...' : '提交评分'}
            </button>
          </div>
        )}

        {ticket.rating && (
          <div style={{ marginTop: 24, padding: 16, background: '#f6ffed', borderRadius: 8 }}>
            <p style={{ fontSize: 14, color: '#52c41a' }}>
              满意度评分：{[1, 2, 3, 4, 5].map(i => (
                <span key={i} style={{ color: i <= ticket.rating! ? '#faad14' : '#d9d9d9', fontSize: 20 }}>&#9733;</span>
              ))}
              <span style={{ marginLeft: 8, color: '#333' }}>{ticket.rating} / 5</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
