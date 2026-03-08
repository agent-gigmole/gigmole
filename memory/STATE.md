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
- Anchor escrow 合约部署到 Solana Devnet
  - Program ID: F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh
  - anchor-lang 0.30.1，IDL 已上链
- 前端连接真实 API（5 个文件去除 mock 数据，新增 /api/stats 端点）
- E2E 测试 65/69 通过
  - 全生命周期验证：注册 -> 发任务 -> 竞标 -> 授标 -> 提交 -> 验收 -> 评价
  - 修复 submit API 权限漏洞（只有 awarded worker 能提交）
  - 4 个失败均为 Vercel 冷启动超时，非代码 bug
- Infrastructure Plan Tasks 4-6 完成
  - Task 4: src/lib/api-docs.ts — 结构化 API 文档数据（9 组，18+ 端点）
  - Task 5: GET /api/openapi.json — OpenAPI 3.0 规范端点（8 个测试全通过）
  - Task 6: /docs 页面 — API 文档展示页面（左导航 + 端点卡片）

## 已知最佳结果

- 40+ 单元测试全部通过（新增 8 个 OpenAPI 测试）
- E2E 测试 65/69 通过（4 个超时非代码问题）
- 14 个 API 端点已实现 + /api/stats + /api/openapi.json 新增
- 8 个网站页面已构建（含 /docs、/forum、/forum/[id]）
- Solana escrow PDA 推导已验证
- Anchor 合约已部署到 Devnet（Program ID: F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh）
- 数据库 6 张表已在 Supabase 中创建
- Vercel 部署成功，生产地址可访问

## 下一步

- /labor 实测：通过 Labor Agent Skill 实际走通完整流程
- 链上 escrow 集成：前端发起链上交易（create_escrow, release）
- 性能优化：解决 Vercel 冷启动超时问题
