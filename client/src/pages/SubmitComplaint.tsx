import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ComplaintType } from '../types';

const complaintTypes: ComplaintType[] = ['司机态度', '到站不准时', '车厢卫生', '站点设施损坏', '其他建议'];

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const [type, setType] = useState<ComplaintType>('司机态度');
  const [description, setDescription] = useState('');
  const [route, setRoute] = useState('');
  const [station, setStation] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!description.trim() || !route.trim() || !station.trim() || !incidentTime) {
      setError('所有字段均为必填');
      return;
    }
    setLoading(true);
    try {
      await api.submitComplaint({ type, description, route, station, incident_time: incidentTime });
      alert('投诉提交成功！工单已生成。');
      navigate('/my-tickets');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>提交投诉 / 建议</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>投诉类型</label>
            <select value={type} onChange={e => setType(e.target.value as ComplaintType)}>
              {complaintTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>事发线路</label>
            <input type="text" value={route} onChange={e => setRoute(e.target.value)} placeholder="例如：101路" />
          </div>
          <div className="form-group">
            <label>事发站点</label>
            <input type="text" value={station} onChange={e => setStation(e.target.value)} placeholder="例如：人民广场站" />
          </div>
          <div className="form-group">
            <label>事发时间</label>
            <input type="datetime-local" value={incidentTime} onChange={e => setIncidentTime(e.target.value)} />
          </div>
          <div className="form-group">
            <label>详细描述</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="请详细描述您遇到的问题或建议..." rows={5} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '提交中...' : '提交工单'}
          </button>
        </form>
      </div>
    </div>
  );
}
