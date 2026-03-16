# 静小静菜品毛利计算系统（Next.js + Vercel）

这个目录是适合部署到 Vercel 的版本，采用：

- Next.js App Router
- Vercel Serverless API Routes
- Turso / libSQL 云数据库

## 本地开发

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

```bash
cp .env.local.example .env.local
```

本地开发有两种方式：

- 推荐：直接配置 Turso，和线上一致
- 临时：不配 `TURSO_DATABASE_URL`，本地会自动使用 `file:./data/local.db`

3. 启动项目

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

首次请求 API 时会自动：

- 创建数据库表
- 在空库时写入默认分类、默认菜品和一个示例套餐

如果你不想自动写入演示数据，可以把：

```bash
SEED_DEFAULT_DATA=false
```

## 部署到 Vercel

### 1. 创建 Turso 数据库

先在 Turso 控制台创建数据库，并拿到：

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

### 2. 在 Vercel 导入项目

将 `tuangou-nextjs` 作为独立项目导入 Vercel。

建议在 Vercel Project Settings 里将 Root Directory 设为：

```bash
tuangou-nextjs
```

### 3. 配置环境变量

在 Vercel 里添加：

```bash
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-auth-token
SEED_DEFAULT_DATA=true
```

说明：

- 线上环境必须配置 `TURSO_DATABASE_URL`
- 生产环境不会回退到本地 SQLite 文件，避免 Vercel 临时文件系统导致数据丢失

### 4. 触发部署

部署完成后，应用在首次访问 API 时会自动完成数据库初始化。

也可以手动访问初始化接口：

```bash
POST /api/init
```

## 当前已支持的核心功能

- 菜品新增、编辑、删除
- 分类新增、删除
- 单品套餐创建
- 套餐新增、编辑、删除、拖拽排序
- 默认演示数据自动初始化

## 设计文档

- 编辑套餐弹窗高保真设计规范：
  [`docs/meal-creator-figma-spec.md`](/Users/wenshuaibi/Documents/claude/tuangou/tuangou-nextjs/docs/meal-creator-figma-spec.md)

## 注意事项

- 这个版本已经比根目录 Vite + Express + 本地 SQLite 更适合给朋友在线共用
- 当前仍然建议把 Turso 数据库当正式数据源，不要在线上依赖本地文件数据库
- 如果你后面需要账号登录、多人权限、操作审计，再继续往上叠就可以
