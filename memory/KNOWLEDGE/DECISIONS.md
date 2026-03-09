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
- **域名**: gigmole.cc（已注册）— gigmole.com 已被他人注册，不可用
- **旧域名**: agenthire.dev 放弃，不续费，不做跳转
- **日期**: 2026-03-09（域名确认 2026-03-09）

## email-binding-architecture
- **背景**: 需要邮箱绑定和 API Key 恢复功能
- **选项**:
  1. email 加到现有 agents 表
  2. 拆出 users 表（人类身份）和 agents 表分离，1:N 关系
- **结论**: 拆出 users 表，1:N（一个人可以有多个 Agent）— **CEO 已确认**
- **CEO 确认的决策**:
  - users/agents 分表：确认拆分 ✅
  - Email：选填 ✅（不绑 email 丢 key 是自己责任）
  - 邮件服务：Resend ✅
  - 邮箱绑定方案：Magic Link + 轮询 ✅（非验证码链接，用户点击 magic link 后前端轮询确认）
  - 验证码：6位数字 ✅
  - 执行顺序：先品牌重塑，再 email 功能 ✅
- **工作量**: 预估 ~18 小时
- **状态**: ✅ **全部完成**（2026-03-09 整晚开发完成）
  - Schema: users + email_bind_tokens + api_key_reset_tokens 表
  - 6 个新 API 端点
  - 前端绑定页面
  - 64 个新测试，207 总测试通过
- **日期**: 2026-03-09（CEO 确认 2026-03-09，开发完成 2026-03-09）

## identity-three-layers
- **背景**: 平台身份体系设计
- **结论**: 三层身份体系
  - Email = 身份证（人类身份标识，可选绑定）
  - API Key = 钥匙（Agent 操作凭证，可通过 email 恢复）
  - Wallet = 银行账户（链上资金操作，可选绑定）
- **原因**: 各层解耦，不强制绑定，用户按需增加安全层级
- **日期**: 2026-03-09

## security-review-findings
- **背景**: 安全方向 Code Review
- **已修复（3 项）**:
  1. verifyApiKey 改用 crypto.timingSafeEqual — 防时序攻击
  2. Admin 任务状态更新加 TaskStatus enum 验证 — 防注入非法状态值
  3. request-reset 加 rate limit（3次/邮箱/小时）— 防邮件轰炸
- **低优先级待处理（4 项）**: 记录在安全审计报告中
- **日期**: 2026-03-09

## agenthire-dev-domain-deprecation
- **背景**: agenthire.dev 域名是否保留做跳转
- **选项**: 续费并设置 301 跳转到 gigmole.cc vs 直接放弃
- **结论**: 放弃，不续费，不做跳转
- **原因**: CEO 决策，节省成本，品牌完全切换到 GigMole
- **日期**: 2026-03-09
