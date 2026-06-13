import { Router, Request, Response } from 'express';
import db from '../db';
import { authMiddleware, roleGuard } from '../auth';

const router = Router();

// 按类型分布
router.get('/stats/by-type', authMiddleware, roleGuard('admin'), (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT type, COUNT(*) as count FROM complaints GROUP BY type ORDER BY count DESC
  `).all();
  res.json(rows);
});

// 按线路排行
router.get('/stats/by-route', authMiddleware, roleGuard('admin'), (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT route, COUNT(*) as count FROM complaints GROUP BY route ORDER BY count DESC
  `).all();
  res.json(rows);
});

// 按月趋势
router.get('/stats/monthly', authMiddleware, roleGuard('admin'), (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
    FROM complaints
    GROUP BY month
    ORDER BY month
  `).all();
  res.json(rows);
});

// 满意度统计
router.get('/stats/satisfaction', authMiddleware, roleGuard('admin'), (_req: Request, res: Response) => {
  const avgRow = db.prepare(`
    SELECT AVG(rating) as avg_rating, COUNT(rating) as rated_count,
           COUNT(*) as total_count FROM complaints
  `).get();
  const distribution = db.prepare(`
    SELECT rating, COUNT(*) as count FROM complaints WHERE rating IS NOT NULL GROUP BY rating ORDER BY rating
  `).all();
  res.json({ summary: avgRow, distribution });
});

// 总览数据
router.get('/stats/overview', authMiddleware, roleGuard('admin'), (_req: Request, res: Response) => {
  const total = (db.prepare('SELECT COUNT(*) as cnt FROM complaints').get() as { cnt: number }).cnt;
  const pending = (db.prepare("SELECT COUNT(*) as cnt FROM complaints WHERE status = '待受理'").get() as { cnt: number }).cnt;
  const processing = (db.prepare("SELECT COUNT(*) as cnt FROM complaints WHERE status = '处理中'").get() as { cnt: number }).cnt;
  const resolved = (db.prepare("SELECT COUNT(*) as cnt FROM complaints WHERE status = '已回复'").get() as { cnt: number }).cnt;
  res.json({ total, pending, processing, resolved });
});

export default router;
