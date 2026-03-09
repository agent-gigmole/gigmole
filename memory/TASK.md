# TASK.md -- 当前任务薄切片（一次只做一件事）

## 当前任务

无 — 等待 CEO 拍板邮箱方案决策点 + 品牌重塑排期

## 目标

P0 安全修复完成，邮箱方案评估完成。等 CEO 拍板 6 个决策点，以及品牌重塑排期。

## 已完成步骤

- [x] AgentKit 框架部署
- [x] MVP 全部 22 个任务
- [x] Supabase 数据库 + Vercel 部署
- [x] Anchor escrow 合约部署
- [x] 前端接入真实 API + E2E 测试
- [x] 平台基础设施升级（13 个任务）
- [x] 网站设计风格重做
- [x] Admin Dashboard（15 个任务）
- [x] User System（13 个任务）
- [x] Escrow Integration（13 个任务）
- [x] Vercel 部署修复：Solana 顶层 import 改为动态 import
- [x] 经营决策文档：docs/business/ 目录（6 个文档）
- [x] Agent Directory 功能
- [x] 品牌名确认 AgentHire + 域名 agenthire.dev
- [x] 全站品牌重塑 aglabor → AgentHire
- [x] 示范 Agent 注册 + 示范任务发布
- [x] GitHub 仓库配置（tensam/agenthire, private）
- [x] 品牌调整：AgentHire → GigMole
- [x] **referredBy 推荐人字段**：schema + 两个注册 API + migration
- [x] **分销/佣金系统评估**：43-48h 工作量，建议初期 off-chain
- [x] **定位调整 v2**：Agent 拥有真实世界资源
- [x] **P0 修复：bind-wallet 签名验证**（nonce + ed25519，8 个测试）
- [x] **P0 修复：accept 路由 walletAddress! 强制解包 bug**（降级处理 + walletWarning，3 个测试）
- [x] **P0 修复：POST /api/tasks escrow 无钱包校验**（2 个测试）
- [x] **邮箱绑定 + API Key 恢复方案评估**（~18h，6 个决策点待 CEO 拍板）

## 待完成步骤

- [ ] CEO 拍板邮箱方案 6 个决策点
- [ ] 注册 gigmole.com 域名
- [ ] 全站品牌重塑：AgentHire → GigMole（代码、部署、域名）
- [ ] 确定新 Tagline（描述平台经济整体，不偏向任一方）
- [ ] 邮箱绑定 + API Key 恢复功能开发（~18h，待 CEO 决策后启动）

## 状态

P0 修复完成（143 测试通过）。邮箱方案评估完成，等 CEO 拍板。品牌重塑待排期（建议先于 email 功能）。

## 阻塞项

- gigmole.com 域名需要用户手动注册
- 邮箱方案 6 个决策点等 CEO 拍板
- 品牌重塑时序问题：如果近期做品牌重塑，应先于 email 功能（避免邮件模板改两次）
