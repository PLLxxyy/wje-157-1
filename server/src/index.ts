import express from 'express';
import cors from 'cors';
import { authMiddleware } from './auth';
import authRoutes from './routes/auth';
import complaintRoutes from './routes/complaints';
import adminRoutes from './routes/admin';

// 确保数据库初始化（import 时自动建表+seed）
import './db';

const app = express();
const PORT = Number(process.env.PORT) || 3203;

app.use(cors());
app.use(express.json());

// 认证路由（公开 + 受保护的 /me 已在 router 内处理）
app.use('/api/auth', authRoutes);

// 受保护路由
app.use('/api/complaints', authMiddleware, complaintRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`[Server] 公交投诉反馈平台后端已启动: http://localhost:${PORT}`);
});
