import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { signToken, authMiddleware } from '../auth';
import { User, Role } from '../types';

const router = Router();

// 注册
router.post('/register', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }
  if (username.length < 2 || password.length < 6) {
    res.status(400).json({ error: '用户名至少2字符，密码至少6字符' });
    return;
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    res.status(409).json({ error: '用户名已存在' });
    return;
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, hash, 'passenger');
  const token = signToken({ id: result.lastInsertRowid as number, username, role: 'passenger' });
  res.json({ token, user: { id: result.lastInsertRowid, username, role: 'passenger' as Role } });
});

// 登录
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }
  const token = signToken({ id: user.id, username: user.username, role: user.role });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// 获取当前用户信息
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  const authUser = (req as any).user;
  if (!authUser) {
    res.status(401).json({ error: '未登录' });
    return;
  }
  const user = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(authUser.id);
  res.json(user);
});

export default router;
