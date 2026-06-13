import { useEffect, useState } from 'react';
import { api } from '../api';
import { Overview, TypeStat, RouteStat, MonthlyStat, SatisfactionSummary } from '../types';

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1'];

export default function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [typeStats, setTypeStats] = useState<TypeStat[]>([]);
  const [routeStats, setRouteStats] = useState<RouteStat[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [satisfaction, setSatisfaction] = useState<SatisfactionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getStatsOverview(),
      api.getStatsByType(),
      api.getStatsByRoute(),
      api.getStatsMonthly(),
      api.getStatsSatisfaction(),
    ]).then(([ov, ty, rt, mo, sa]) => {
      setOverview(ov as Overview);
      setTypeStats(ty as TypeStat[]);
      setRouteStats(rt as RouteStat[]);
      setMonthlyStats(mo as MonthlyStat[]);
      setSatisfaction(sa as SatisfactionSummary);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="container"><p style={{ color: '#999' }}>加载中...</p></div>;

  const maxRouteCount = Math.max(...routeStats.map(r => r.count), 1);
  const maxTypeCount = Math.max(...typeStats.map(t => t.count), 1);
  const maxSatCount = satisfaction ? Math.max(...satisfaction.distribution.map(d => d.count), 1) : 1;

  return (
    <div className="container">
      {/* 总览卡片 */}
      {overview && (
        <div className="stat-grid">
          <div className="stat-item">
            <div className="num">{overview.total}</div>
            <div className="label">总工单数</div>
          </div>
          <div className="stat-item">
            <div className="num" style={{ color: '#faad14' }}>{overview.pending}</div>
            <div className="label">待受理</div>
          </div>
          <div className="stat-item">
            <div className="num" style={{ color: '#1890ff' }}>{overview.processing}</div>
            <div className="label">处理中</div>
          </div>
          <div className="stat-item">
            <div className="num" style={{ color: '#52c41a' }}>{overview.resolved}</div>
            <div className="label">已回复</div>
          </div>
        </div>
      )}

      <div className="chart-grid">
        {/* 类型分布 */}
        <div className="card">
          <h2>投诉类型分布</h2>
          <div className="bar-chart">
            {typeStats.map((item, i) => (
              <div className="bar-row" key={item.type}>
                <span className="bar-label">{item.type}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(item.count / maxTypeCount) * 100}%`,
                      background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[i % COLORS.length]}dd)`,
                    }}
                  >
                    <span>{item.count}</span>
                  </div>
                </div>
                <span className="bar-count">{item.count}件</span>
              </div>
            ))}
          </div>
        </div>

        {/* 线路排行 */}
        <div className="card">
          <h2>高频问题线路排行</h2>
          <div className="bar-chart">
            {routeStats.map((item, i) => (
              <div className="bar-row" key={item.route}>
                <span className="bar-label">{item.route}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(item.count / maxRouteCount) * 100}%`,
                      background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[i % COLORS.length]}dd)`,
                    }}
                  >
                    <span>{item.count}</span>
                  </div>
                </div>
                <span className="bar-count">{item.count}件</span>
              </div>
            ))}
          </div>
        </div>

        {/* 月度趋势 */}
        <div className="card">
          <h2>月度投诉趋势</h2>
          {monthlyStats.length === 0 ? (
            <div className="empty-state"><p>暂无数据</p></div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 8, paddingTop: 20 }}>
              {monthlyStats.map(item => {
                const maxCount = Math.max(...monthlyStats.map(m => m.count), 1);
                const h = (item.count / maxCount) * 160;
                return (
                  <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{item.count}</span>
                    <div style={{
                      width: '100%', maxWidth: 60, height: h, background: 'linear-gradient(180deg, #1890ff, #40a9ff)',
                      borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease',
                    }} />
                    <span style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{item.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 满意度统计 */}
        <div className="card">
          <h2>满意度统计</h2>
          {satisfaction && (
            <>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: '#666' }}>
                  平均评分：<span style={{ fontSize: 28, fontWeight: 700, color: '#faad14' }}>
                    {satisfaction.summary.avg_rating ? Number(satisfaction.summary.avg_rating).toFixed(1) : '-'}
                  </span> / 5
                </p>
                <p style={{ fontSize: 13, color: '#999', marginTop: 4 }}>
                  已评价 {satisfaction.summary.rated_count} / 共 {satisfaction.summary.total_count} 件
                </p>
              </div>
              <div>
                {[5, 4, 3, 2, 1].map(star => {
                  const item = satisfaction.distribution.find(d => d.rating === star);
                  const count = item ? item.count : 0;
                  return (
                    <div className="sat-row" key={star}>
                      <span className="sat-label">{star} 星</span>
                      <div className="sat-bar">
                        <div className="sat-fill" style={{ width: `${(count / maxSatCount) * 100}%` }} />
                      </div>
                      <span className="sat-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
