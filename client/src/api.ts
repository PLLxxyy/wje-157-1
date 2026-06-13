const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };
  const res = await fetch(`${BASE}${url}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: { id: number; username: string; role: string } }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ username, password }),
    }),
  register: (username: string, password: string) =>
    request<{ token: string; user: { id: number; username: string; role: string } }>('/auth/register', {
      method: 'POST', body: JSON.stringify({ username, password }),
    }),
  getMe: () => request<{ id: number; username: string; role: string }>('/auth/me'),

  submitComplaint: (data: { type: string; description: string; route: string; station: string; incident_time: string }) =>
    request<unknown>('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  getMyComplaints: () => request<unknown[]>('/complaints/my'),
  getComplaintDetail: (id: number) => request<unknown>(`/complaints/${id}`),

  getAllComplaints: (params?: { type?: string; route?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.route) qs.set('route', params.route);
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString();
    return request<unknown[]>(`/complaints${q ? '?' + q : ''}`);
  },
  processComplaint: (id: number, data: { status: string; reply: string }) =>
    request<unknown>(`/complaints/${id}/process`, { method: 'PUT', body: JSON.stringify(data) }),
  rateComplaint: (id: number, rating: number) =>
    request<unknown>(`/complaints/${id}/rate`, { method: 'PUT', body: JSON.stringify({ rating }) }),

  getStatsByType: () => request<unknown[]>('/admin/stats/by-type'),
  getStatsByRoute: () => request<unknown[]>('/admin/stats/by-route'),
  getStatsMonthly: () => request<unknown[]>('/admin/stats/monthly'),
  getStatsSatisfaction: () => request<unknown>('/admin/stats/satisfaction'),
  getStatsOverview: () => request<unknown>('/admin/stats/overview'),
};
