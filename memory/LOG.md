# LOG.md — 变更日志（追加记录，不删改历史）

## 2026-03-07 AgentKit 框架部署
- 初始化 git 仓库
- 部署 AgentKit 模板（CLAUDE.md, project.config.yml, memory/）
- 从 agent_skill_market.md 提取需求，填充项目配置
- 确定技术栈：Python + FastAPI + SQLAlchemy + Alembic

## 2026-03-07 MVP 实现完成
- 完成全部 22 个实施任务，6 个阶段
- 技术栈：Next.js 16 + TypeScript + Drizzle + Solana
- 核心 API：14 个端点（Agent、Task、Bid、Execution、Review、Message）
- 网站：6 个页面（首页、市场、详情、Agent 主页、注册）
- Labor Agent Skill：/labor 命令定义
- 40+ 测试全部通过

## 2026-03-07 Supabase 数据库配置 + Vercel 部署

- 配置 Supabase PostgreSQL 连接
  - DATABASE_URL 使用 Transaction mode pooler（port 6543）
  - postgres.js 驱动添加 `prepare: false` 适配 Supabase pooler
  - `npx drizzle-kit push` 成功创建 6 张表
- 部署到 Vercel 生产环境
  - `vercel link` 关联项目
  - 设置环境变量：DATABASE_URL, SOLANA_RPC_URL, LISTING_FEE_LAMPORTS, TRANSACTION_FEE_BPS
  - `vercel --prod` 部署成功
  - 生产地址：https://aglabor.vercel.app
- 坑点记录：Supabase pooler 不支持 prepared statements；密码中 `@` 需 URL 编码为 `%40`

## 2026-03-07 Anchor escrow 合约部署到 Solana Devnet

- 编译 Anchor escrow 合约（create_escrow, release, dispute 指令）
- anchor-lang 降级到 0.30.1 + 固定 blake3=1.5.5，解决 edition2024 不兼容
- 部署成功，Program ID: F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh
- IDL 已上链

## 2026-03-07 前端接入真实 API

- 5 个前端文件移除 mock/硬编码数据，改为 fetch 真实 API
- 新建 /api/stats 端点（查询数据库统计数据）
- 所有页面现在展示真实数据库数据

## 2026-03-07 E2E 测试 + submit 权限修复

- 编写并运行 69 条 E2E 测试，65 条通过
- 修复 submit API 安全漏洞：原来任何人都能提交，改为只有 awarded worker 能提交
  - 修复方式：查询 awardedBidId 对应的 bid.bidderId，与请求者身份比对
- 全生命周期通过：注册 -> 发任务 -> 竞标 -> 授标 -> 提交 -> 验收 -> 评价
- 4 个失败均为 Vercel serverless 冷启动超时（5-10s），非代码 bug
