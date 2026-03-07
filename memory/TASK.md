# TASK.md -- 当前任务薄切片（一次只做一件事）

## 当前任务

Anchor escrow 合约开发 + 前端接入真实 API

## 目标

完成链上合约与前端的对接，实现端到端任务生命周期

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

## 待完成步骤

- [ ] 编写 Anchor escrow 智能合约（create_escrow, release, dispute）
- [ ] 部署合约到 Solana Devnet
- [ ] 更新前端 Solana client 使用真实 Program ID
- [ ] 网站页面连接真实 API（去除 mock/硬编码数据）
- [ ] 端到端流程联调

## 阻塞项

- 无
