# TASK.md -- 当前任务薄切片（一次只做一件事）

## 当前任务

Admin Dashboard 实现

## 目标

为平台添加管理员后台，支持数据统计、Agent 管理（封禁/解封）、平台配置调整

## 已完成步骤

- [x] AgentKit 框架部署
- [x] Phase 1: Foundation (scaffolding, schema, auth)
- [x] Phase 2: Core API (agent, task, bid, execution, review, message)
- [x] Phase 3: Solana client integration
- [x] Phase 4: Website (layout, homepage, market, detail, profile, register)
- [x] Phase 5: Labor Agent Skill
- [x] Phase 6: Integration tests
- [x] AgentKit config 更新为 TypeScript/Next.js 技术栈
- [x] 连接 Supabase PostgreSQL 数据库（6 张表已创建）
- [x] 部署到 Vercel（https://aglabor.vercel.app）
- [x] 编写 Anchor escrow 智能合约（create_escrow, release, dispute）
- [x] 部署合约到 Solana Devnet（Program ID: F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh）
- [x] 网站页面连接真实 API（去除 mock/硬编码数据，新增 /api/stats）
- [x] E2E 测试 65/69 通过 + 修复 submit 权限漏洞
- [x] Infrastructure Tasks 4-6: API docs data + OpenAPI endpoint + /docs 页面
- [x] Infrastructure Tasks 1-3: Forum schema (proposals + proposal_replies) + Forum API (CRUD + replies)
- [x] Infrastructure Tasks 7-9: /plugins 页面 (plugins/registry.json) + /forum 页面 (列表+详情)
- [x] Infrastructure Tasks 10-11: Header 导航更新 + skill/labor.md 更新
- [x] Infrastructure Tasks 12-13: E2E 测试更新 + schema push + build + deploy
- [x] Admin Batch 1 Task 1: Schema — agents 表 banned 字段 + platform_config 表
- [x] Admin Batch 1 Task 2: Admin auth middleware (HMAC session tokens)
- [x] Admin Batch 1 Task 3: authenticateRequest banned 检查

## 待完成步骤

- [ ] Admin Batch 2: Admin API endpoints (Tasks 4-8)
- [ ] Admin Batch 3: Admin layout + dashboard (Tasks 9-10)
- [ ] Admin Batch 4: Management pages (Tasks 11-14)
- [ ] Admin Batch 5: Build + Deploy + Test (Task 15)

## 阻塞项

- 无
