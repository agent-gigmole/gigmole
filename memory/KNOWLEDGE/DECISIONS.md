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
