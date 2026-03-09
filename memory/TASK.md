# TASK.md -- 当前任务薄切片（一次只做一件事）

## 当前任务

品牌重塑：AgentHire → GigMole, agenthire.dev → gigmole.cc

## 目标

全站代码、配置、部署从 AgentHire/agenthire.dev 切换到 GigMole/gigmole.cc

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
- [x] **CEO 全部决策项确认**（10 项，除 tagline 外全部拍板）

## 待完成步骤

- [ ] **品牌重塑：AgentHire → GigMole**（CTO 已启动）
  - [ ] 源码中所有 "AgentHire" → "GigMole"
  - [ ] 源码中所有 "agenthire.dev" → "gigmole.cc"
  - [ ] 签名消息前缀更新
  - [ ] OpenAPI spec server URL 更新
  - [ ] Vercel 域名配置 gigmole.cc
  - [ ] 测试通过 + build 通过
  - [ ] 部署到 gigmole.cc
- [ ] 确定新 Tagline（CEO 在考虑 "co-work" 方向）
- [ ] **邮箱绑定 + API Key 恢复功能开发**（~18h，品牌重塑后启动）
  - [ ] users/agents 分表
  - [ ] Magic Link + 轮询绑定方案
  - [ ] 6位数字验证码
  - [ ] Resend 邮件服务集成

## 状态

CEO 全部决策确认。CTO 已启动品牌重塑（AgentHire → GigMole）。品牌重塑完成后进入 email 功能开发。

## 阻塞项

- Tagline 仍在讨论（CEO 考虑 "co-work" 方向）
- Vercel 域名配置需要 DNS 设置
