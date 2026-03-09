# DECISIONS.md — 关键决策记录

<!-- 为什么选择这个方案而不是那个 -->
<!-- 格式：## 决策标题 + 背景 + 选项 + 结论 + 日期 -->

## tech-stack
- **背景**: 需要选择全栈框架和 ORM
- **选项**: Next.js + Drizzle vs FastAPI + SQLAlchemy vs Remix + Prisma
- **结论**: Next.js 16 + TypeScript + Drizzle ORM + PostgreSQL — 全栈统一、类型安全、App Router API Routes、Solana 生态 TS SDK 成熟
- **日期**: 2026-03-07

## task-state-machine
- **背景**: 任务生命周期状态设计
- **选项**: 简单二态(open/done) vs 完整状态机
- **结论**: open → awarded → in_progress → submitted → accepted/rejected/disputed — 覆盖竞标、执行、争议全流程
- **日期**: 2026-03-07

## payment-currency
- **背景**: 任务报酬的货币单位
- **选项**: SOL vs USDC vs 自定义 token
- **结论**: USDC on Solana — 稳定币避免波动风险，金额用 lamports（整数）存储
- **日期**: 2026-03-07

## referral-commission-strategy
- **背景**: 需要分销/推荐佣金系统，referredBy 字段已完成
- **选项**:
  1. 链上佣金合约（自动分账，透明可验证，但开发复杂 40+ 小时）
  2. Off-chain 数据库记录（简单快速，定期手动结算，后期可上链）
- **结论**: 初期用 off-chain 方案（数据库记录佣金，定期手动结算），后期再考虑链上合约
- **原因**: 预计总工作量 43-48 小时中等复杂度，初期无需链上透明性，先用最小方案验证业务逻辑
- **日期**: 2026-03-09

## tagline-strategy
- **背景**: GigMole 平台需要 tagline
- **选项**: 偏 worker 侧 vs 偏 publisher 侧 vs 描述整体网络
- **结论**: tagline 不应偏向 worker 或 publisher 任一方，应描述平台经济/网络整体
- **原因**: 平台稀缺资源是 publisher（需求方），不是 worker。偏向任一方都不准确
- **状态**: 待定
- **日期**: 2026-03-09

## brand-gigmole
- **背景**: 品牌从 AgentHire 转向 GigMole
- **选项**: AgentHire（专业正式）vs GigMole（有趣有画面感）
- **结论**: GigMole — 鼹鼠隐喻，品牌传播性 > 专业感
- **核心差异化**: Agent 不仅有代码能力，还可拥有真实世界资源（粉丝、账号、数据）
- **定位**: 人拥有资源但不工作，Agent 代人工作，平台始终 Agent-to-Agent
- **域名**: gigmole.com 待注册
- **日期**: 2026-03-09
