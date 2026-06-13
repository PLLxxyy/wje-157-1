import { Router, Request, Response } from 'express';
import db from '../db';
import { authMiddleware, roleGuard } from '../auth';
import { Complaint, ComplaintStatus, JwtPayload } from '../types';

const router = Router();

// 生成工单号
function generateTicketNo(): string {
  const now = new Date();
  const date = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const count = (db.prepare("SELECT COUNT(*) as cnt FROM complaints WHERE ticket_no LIKE ?").get(`BUS-${date}-%`) as { cnt: number }).cnt;
  return `BUS-${date}-${String(count + 1).padStart(3, '0')}`;
}

// 提交投诉（乘客）
router.post('/', authMiddleware, roleGuard('passenger'), (req: Request, res: Response) => {
  const user = (req as any).user as JwtPayload;
  const { type, description, route, station, incident_time } = req.body;

  if (!type || !description || !route || !station || !incident_time) {
    res.status(400).json({ error: '所有字段均为必填' });
    return;
  }

  const ticket_no = generateTicketNo();
  const result = db.prepare(`
    INSERT INTO complaints (ticket_no, user_id, type, description, route, station, incident_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(ticket_no, user.id, type, description, route, station, incident_time);

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(complaint);
});

// 我的工单列表（乘客）
router.get('/my', authMiddleware, roleGuard('passenger'), (req: Request, res: Response) => {
  const user = (req as any).user as JwtPayload;
  const rows = db.prepare('SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
  res.json(rows);
});

// 工单详情
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const row = db.prepare(`
    SELECT c.*, u.username FROM complaints c JOIN users u ON c.user_id = u.id WHERE c.id = ?
  `).get(req.params.id);
  if (!row) {
    res.status(404).json({ error: '工单不存在' });
    return;
  }
  res.json(row);
});

// 所有工单列表（客服/管理员）
router.get('/', authMiddleware, roleGuard('staff', 'admin'), (req: Request, res: Response) => {
  const { type, route, status } = req.query;
  let sql = 'SELECT c.*, u.username FROM complaints c JOIN users u ON c.user_id = u.id WHERE 1=1';
  const params: string[] = [];

  if (type && typeof type === 'string') {
    sql += ' AND c.type = ?';
    params.push(type);
  }
  if (route && typeof route === 'string') {
    sql += ' AND c.route = ?';
    params.push(route);
  }
  if (status && typeof status === 'string') {
    sql += ' AND c.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY c.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// 客服处理工单
router.put('/:id/process', authMiddleware, roleGuard('staff'), (req: Request, res: Response) => {
  const { status, reply } = req.body;
  if (!status) {
    res.status(400).json({ error: '状态不能为空' });
    return;
  }
  const validStatuses: ComplaintStatus[] = ['待受理', '处理中', '已回复'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: '无效的状态值' });
    return;
  }

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id) as Complaint | undefined;
  if (!complaint) {
    res.status(404).json({ error: '工单不存在' });
    return;
  }

  db.prepare(`
    UPDATE complaints SET status = ?, reply = ?, updated_at = datetime('now','localtime') WHERE id = ?
  `).run(status, reply || complaint.reply, req.params.id);

  const updated = db.prepare('SELECT c.*, u.username FROM complaints c JOIN users u ON c.user_id = u.id WHERE c.id = ?').get(req.params.id);
  res.json(updated);
});

// 满意度评分（乘客）
router.put('/:id/rate', authMiddleware, roleGuard('passenger'), (req: Request, res: Response) => {
  const user = (req as any).user as JwtPayload;
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: '评分必须在 1-5 之间' });
    return;
  }

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ? AND user_id = ?').get(req.params.id, user.id) as Complaint | undefined;
  if (!complaint) {
    res.status(404).json({ error: '工单不存在' });
    return;
  }
  if (complaint.status !== '已回复') {
    res.status(400).json({ error: '只能对已回复的工单评分' });
    return;
  }

  db.prepare('UPDATE complaints SET rating = ? WHERE id = ?').run(rating, req.params.id);
  const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
  res.json(updated);
});

export default router;
