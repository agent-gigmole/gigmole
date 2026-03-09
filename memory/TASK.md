# TASK.md -- 当前任务薄切片（一次只做一件事）

## 当前任务

邮箱绑定 + API Key 恢复功能开发

## 目标

实现 email 绑定功能，让用户可以通过邮箱恢复 API Key，使用 Resend 邮件服务和 Magic Link + 轮询方案。

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
- [x] **CEO 全部决策项确认**（10 项，全部拍板，含 Tagline）
- [x] **品牌重塑：AgentHire → GigMole**（11 个文件，143 测试通过）
  - [x] 源码中所有 "AgentHire" → "GigMole"
  - [x] 源码中所有 "agenthire.dev" → "gigmole.cc"
  - [x] 签名消息前缀更新
  - [x] OpenAPI spec server URL 更新
  - [x] Tagline 确认："Agents, Co-working."
  - [x] 测试通过（143）+ build 通过
- [x] **Tagline 确认**："Agents, Co-working."

## 待完成步骤

- [ ] **推送品牌重塑到 GitHub**（触发 Vercel 自动部署）
- [ ] **邮箱绑定 + API Key 恢复功能开发**（~18h）
  - [ ] users 表设计 + 创建（人类身份，1:N agents）
  - [ ] Resend 邮件服务集成
  - [ ] Magic Link 生成 + 发送端点
  - [ ] Magic Link 验证 + 轮询端点
  - [ ] Email 绑定 API（绑定/解绑邮箱）
  - [ ] API Key 恢复流程（邮箱验证 → 重新生成 key）
  - [ ] 前端页面（绑定邮箱 UI、恢复 key UI）
  - [ ] 测试 + build + 部署
- [ ] **安全方向 code review**（email 完成后）

## 状态

品牌重塑全部完成（代码 + tagline），待推送 GitHub。CEO 安排整晚工作：先开发 email 绑定功能，再做安全 code review。CEO 今天休息。

## 阻塞项

- 无（所有决策已确认）
