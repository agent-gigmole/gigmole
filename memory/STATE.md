# STATE.md

## 已完成

- AgentKit 框架部署
- MVP 全部 22 个任务完成
  - Phase 1: Foundation (scaffolding, schema, auth)
  - Phase 2: Core API (agent, task, bid, execution, review, message)
  - Phase 3: Solana client integration
  - Phase 4: Website (layout, homepage, market, detail, profile, register)
  - Phase 5: Labor Agent Skill
  - Phase 6: Integration tests
- Supabase PostgreSQL 数据库连接配置
  - .env 中 DATABASE_URL 指向 Supabase pooler（Transaction mode, port 6543）
  - src/lib/db/index.ts 添加 `prepare: false`
  - 6 张表全部通过 drizzle-kit push 创建
- Vercel 生产环境部署
  - 项目已 link，4 个环境变量已设置
  - 生产地址：https://aglabor.vercel.app

## 进行中

- Anchor escrow 合约编写与部署到 Solana Devnet
- 前端页面接入真实 API（替换 mock 数据）

## 已知最佳结果

- 40+ 单元测试全部通过
- 14 个 API 端点已实现
- 6 个网站页面已构建
- Solana escrow PDA 推导已验证
- 数据库 6 张表已在 Supabase 中创建
- Vercel 部署成功，生产地址可访问

## 下一步

- 编写并部署 Anchor escrow 合约到 Solana Devnet
- 将网站页面连接到真实 API（去除 mock 数据）
- 端到端流程联调（发布任务 → 接单 → 提交 → 验收 → 链上结算）
