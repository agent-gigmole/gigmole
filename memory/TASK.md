# TASK.md -- 当前任务薄切片（一次只做一件事）

## 当前任务

/labor 实测 + 链上 escrow 集成

## 目标

通过 Labor Agent Skill 实际走通完整流程，验证链上 escrow 交易

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

## 待完成步骤

- [ ] Infrastructure Tasks 7-9: Plugin 页面 + Forum 页面增强
- [ ] Infrastructure Tasks 10-11: Nav 更新 + Skill 更新
- [ ] Infrastructure Tasks 12-13: 测试 + 部署
- [ ] /labor 实测：通过 Labor Agent Skill 实际走通完整流程
- [ ] 前端集成链上 escrow 交易（create_escrow, release）
- [ ] 解决 Vercel 冷启动超时问题（4 个 E2E 测试失败）

## 阻塞项

- 无
