import Database, { type Database as SqliteDatabase } from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'db.sqlite');
const db: SqliteDatabase = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 建表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('passenger','staff','admin')),
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_no TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    route TEXT NOT NULL,
    station TEXT NOT NULL,
    incident_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT '待受理' CHECK(status IN ('待受理','处理中','已回复')),
    reply TEXT DEFAULT '',
    rating INTEGER CHECK(rating IS NULL OR (rating >= 1 AND rating <= 5)),
    urged INTEGER NOT NULL DEFAULT 0,
    urged_at TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

const columns = db.prepare("PRAGMA table_info(complaints)").all() as { name: string }[];
const colNames = columns.map(c => c.name);
if (!colNames.includes('urged')) {
  db.exec(`ALTER TABLE complaints ADD COLUMN urged INTEGER NOT NULL DEFAULT 0`);
}
if (!colNames.includes('urged_at')) {
  db.exec(`ALTER TABLE complaints ADD COLUMN urged_at TEXT`);
}

// Seed：如果 users 表为空则插入测试数据
const userCount = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }).cnt;

if (userCount === 0) {
  const hash = bcrypt.hashSync('123456', 10);

  const insertUser = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
  insertUser.run('passenger', hash, 'passenger');
  insertUser.run('staff', hash, 'staff');
  insertUser.run('admin', hash, 'admin');

  // 预置测试工单
  const insertComplaint = db.prepare(`
    INSERT INTO complaints (ticket_no, user_id, type, description, route, station, incident_time, status, reply, rating, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedComplaints = [
    {
      ticket_no: 'BUS-20260101-001',
      user_id: 1,
      type: '司机态度',
      description: '今日乘坐101路公交车，司机态度非常恶劣，对老年乘客大声呵斥，拒绝等待正在赶来的乘客。',
      route: '101路',
      station: '人民广场站',
      incident_time: '2026-06-10 08:30',
      status: '已回复',
      reply: '感谢您的反馈，已对该司机进行批评教育并记录在案，后续将加强服务培训。',
      rating: 4,
      created_at: '2026-06-10 09:00',
      updated_at: '2026-06-10 15:00',
    },
    {
      ticket_no: 'BUS-20260610-002',
      user_id: 1,
      type: '到站不准时',
      description: '连续三天在科技园站等202路早班车，站牌显示7:15到站，实际7:35才来，严重影响通勤。',
      route: '202路',
      station: '科技园站',
      incident_time: '2026-06-09 07:15',
      status: '处理中',
      reply: '',
      rating: null,
      created_at: '2026-06-09 12:00',
      updated_at: '2026-06-10 10:00',
    },
    {
      ticket_no: 'BUS-20260611-003',
      user_id: 1,
      type: '车厢卫生',
      description: '303路公交车车厢内有明显异味，座位上有污渍，地板很脏，整体卫生状况极差。',
      route: '303路',
      station: '火车站',
      incident_time: '2026-06-11 14:00',
      status: '待受理',
      reply: '',
      rating: null,
      created_at: '2026-06-11 16:00',
      updated_at: '2026-06-11 16:00',
    },
    {
      ticket_no: 'BUS-20260612-004',
      user_id: 1,
      type: '站点设施损坏',
      description: '体育馆站候车亭顶棚破漏，雨天无法遮雨；站牌信息模糊不清，线路信息难以辨认。',
      route: '101路',
      station: '体育馆站',
      incident_time: '2026-06-12 09:00',
      status: '待受理',
      reply: '',
      rating: null,
      created_at: '2026-06-12 11:00',
      updated_at: '2026-06-12 11:00',
    },
    {
      ticket_no: 'BUS-20260608-005',
      user_id: 1,
      type: '其他建议',
      description: '建议505路在早晚高峰增加发车频次，目前间隔20分钟太长，车厢拥挤不堪。',
      route: '505路',
      station: '大学城站',
      incident_time: '2026-06-08 17:30',
      status: '已回复',
      reply: '感谢您的建议，已提交运营部门评估高峰时段运力调整方案。',
      rating: 5,
      created_at: '2026-06-08 18:00',
      updated_at: '2026-06-09 16:00',
    },
    {
      ticket_no: 'BUS-20260607-006',
      user_id: 1,
      type: '司机态度',
      description: '101路司机在乘客询问下车站点时不耐烦地挥手示意，不予回答，服务态度需要改进。',
      route: '101路',
      station: '中山路站',
      incident_time: '2026-06-07 10:00',
      status: '已回复',
      reply: '已收到反馈，已安排该司机参加服务礼仪培训。',
      rating: 3,
      created_at: '2026-06-07 12:00',
      updated_at: '2026-06-08 09:00',
    },
    {
      ticket_no: 'BUS-20260605-007',
      user_id: 1,
      type: '到站不准时',
      description: '202路晚班车间隔时间过长，站牌显示20分钟一班，实际等了40分钟。',
      route: '202路',
      station: '中心医院站',
      incident_time: '2026-06-05 21:00',
      status: '已回复',
      reply: '已核实情况，将优化晚班调度计划。',
      rating: 4,
      created_at: '2026-06-05 22:00',
      updated_at: '2026-06-06 14:00',
    },
    {
      ticket_no: 'BUS-20260603-008',
      user_id: 1,
      type: '车厢卫生',
      description: '404路车厢座椅有口香糖残留，窗户玻璃污浊，建议加强日常清洁。',
      route: '404路',
      station: '文化宫站',
      incident_time: '2026-06-03 15:00',
      status: '已回复',
      reply: '已安排深度清洁，后续将加强车辆卫生检查频次。',
      rating: 3,
      created_at: '2026-06-03 17:00',
      updated_at: '2026-06-04 10:00',
    },
  ];

  const insertMany = db.transaction((rows: typeof seedComplaints) => {
    for (const r of rows) {
      insertComplaint.run(r.ticket_no, r.user_id, r.type, r.description, r.route, r.station, r.incident_time, r.status, r.reply, r.rating, r.created_at, r.updated_at);
    }
  });
  insertMany(seedComplaints);

  console.log('[DB] Seed data inserted: 3 users, 8 complaints');
}

export default db;
