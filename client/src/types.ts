export type Role = 'passenger' | 'staff' | 'admin';

export interface User {
  id: number;
  username: string;
  role: Role;
}

export type ComplaintType = '司机态度' | '到站不准时' | '车厢卫生' | '站点设施损坏' | '其他建议';
export type ComplaintStatus = '待受理' | '处理中' | '已回复';

export interface Complaint {
  id: number;
  ticket_no: string;
  user_id: number;
  type: ComplaintType;
  description: string;
  route: string;
  station: string;
  incident_time: string;
  status: ComplaintStatus;
  reply: string;
  rating: number | null;
  urged: number;
  urged_at: string | null;
  created_at: string;
  updated_at: string;
  username?: string;
}

export interface TypeStat { type: string; count: number; }
export interface RouteStat { route: string; count: number; }
export interface MonthlyStat { month: string; count: number; }
export interface SatisfactionSummary {
  summary: { avg_rating: number | null; rated_count: number; total_count: number };
  distribution: { rating: number; count: number }[];
}
export interface Overview { total: number; pending: number; processing: number; resolved: number; }
