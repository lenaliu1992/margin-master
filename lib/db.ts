import { createClient } from '@libsql/client';
import { seedDefaultData } from './seed-data';

function resolveDatabaseUrl(): string {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const localDbUrl = process.env.LOCAL_DB_URL || 'file:./data/local.db';
  const isVercelDeployment = process.env.VERCEL === '1';

  if (tursoUrl) {
    return tursoUrl;
  }

  if (isVercelDeployment) {
    throw new Error('缺少 TURSO_DATABASE_URL。部署到 Vercel 时必须连接 Turso/libSQL，不能回退到本地文件数据库。');
  }

  return localDbUrl;
}

const dbUrl = resolveDatabaseUrl();
const dbAuthToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const db = createClient({
  url: dbUrl,
  authToken: dbAuthToken,
});

let readyPromise: Promise<void> | null = null;

// 初始化数据库表结构（首次部署时调用）
export async function initTables() {
  // 菜品表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS dishes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cost REAL NOT NULL,
      price REAL,
      category_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      source TEXT CHECK(source IN ('initial', 'user')) DEFAULT 'user'
    )
  `);

  // 菜品分类表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS dish_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '🍽️',
      color TEXT DEFAULT '#6b7280',
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      source TEXT CHECK(source IN ('initial', 'user')) DEFAULT 'user'
    )
  `);

  // 套餐表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      standard_price REAL NOT NULL,
      promo_price1 REAL NOT NULL,
      promo_price2 REAL,
      sort_order INTEGER DEFAULT 0,
      is_single_dish INTEGER DEFAULT 0,
      sync_dish_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      source TEXT CHECK(source IN ('initial', 'user')) DEFAULT 'user'
    )
  `);

  // 套餐菜品关联表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS meal_dishes (
      id TEXT PRIMARY KEY,
      meal_id TEXT NOT NULL,
      dish_id TEXT NOT NULL,
      dish_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (meal_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
      UNIQUE(meal_id, dish_id, dish_order)
    )
  `);

  // 创建索引
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_dishes_name ON dishes(name)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_dishes_deleted ON dishes(deleted_at)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_meal_plans_order ON meal_plans(sort_order)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_meal_plans_deleted ON meal_plans(deleted_at)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_meal_dishes_meal_id ON meal_dishes(meal_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_meal_dishes_dish_id ON meal_dishes(dish_id)`);

  console.log('✅ 数据库表结构初始化完成');
}

async function seedDatabaseIfNeeded() {
  if (process.env.SEED_DEFAULT_DATA === 'false') {
    return;
  }

  const result = await db.execute('SELECT COUNT(*) as count FROM dishes');
  const count = Number(result.rows[0]?.count || 0);

  if (count > 0) {
    return;
  }

  await seedDefaultData(db);
  console.log('✅ 默认演示数据已写入');
}

export async function ensureDatabaseReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      await initTables();
      await seedDatabaseIfNeeded();
    })().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }

  await readyPromise;
}

// 获取当前时间戳（秒）
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
