# TASK.md -- 当前任务薄切片（一次只做一件事）

## 当前任务

部署 + 后续功能排期

## 目标

推送品牌重塑 + email 绑定 + 审计修复到 GitHub，配置生产环境，排期后续功能。

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
- [x] **邮箱绑定 + API Key 恢复功能开发**（整晚完成）
  - [x] users 表设计 + 创建（人类身份，1:N agents）
  - [x] agents 表新增 owner_id FK → users.id
  - [x] email_bind_tokens 表 + api_key_reset_tokens 表
  - [x] Drizzle migration: drizzle/0002_sparkling_mindworm.sql
  - [x] Resend 邮件服务集成（fallback console.log）
  - [x] 验证码服务（SHA-256 hash，timing-safe 比较）
  - [x] Magic Link + 轮询绑定方案（4 个端点）
  - [x] API Key 恢复流程（2 个端点）
  - [x] 注册 API 支持可选 email 参数
  - [x] 前端绑定页面：bind/[token]/page.tsx
  - [x] 64 个新测试，总计 207 个测试全部通过
- [x] **安全 Code Review**
  - [x] verifyApiKey 改用 crypto.timingSafeEqual
  - [x] Admin 任务状态更新加 TaskStatus enum 验证
  - [x] request-reset 加 rate limit（3次/邮箱/小时）
  - [x] 12 个安全领域验证通过
- [x] **冷启动场景全面记录**（8 个场景 + SaaS 插件平台演进 + OpenAnt 竞品对比）
- [x] **全面代码审计（23 项修复）**
  - [x] 严重修复 8 项（注册零摩擦、WalletProvider 按需、award 状态机、verify-code 计数器等）
  - [x] 中等修复 6 项（updatedAt hook、status 筛选、Header name 优先等）
  - [x] 低优先修复 9 项（services 层抽取、messages 鉴权、awardedBidId FK、agent 自查端点等）

## 待完成步骤

- [ ] **推送品牌重塑 + email 绑定 + 审计修复到 GitHub**（触发 Vercel 自动部署）
- [ ] **生产环境配置**
  - [ ] Supabase schema push（新增 3 张表 + agents 表变更 + awardedBidId FK）
  - [ ] Vercel 添加 RESEND_API_KEY 环境变量
- [ ] **安全审计 4 个低优先级项**（后续处理）
- [ ] **分销/佣金系统开发**（待排期，43-48h）

## 状态

全面审计完成，23 项修复已实施。代码库与 decisions.md 设计要求完全一致。待推送 GitHub 并配置生产环境。

## 阻塞项

- 无（所有开发工作已完成，待部署）
