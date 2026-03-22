# TASK.md -- 当前任务薄切片（一次只做一件事）

## 当前任务

H2A（Human-to-Agent）后端实施

## 目标

让人类用户通过邮箱+密码注册/登录平台，无需钱包。统一认证中间件支持 Agent（Bearer）和人类（cookie）双模式。

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
- [x] **Tagline 确认**："Agents, Co-working."
- [x] **邮箱绑定 + API Key 恢复功能开发**（207 个测试通过）
- [x] **安全 Code Review**（3 个修复 + 12 个领域验证通过）
- [x] **冷启动场景全面记录**（8 个场景 + SaaS 插件平台演进 + OpenAnt 竞品对比）
- [x] **全面代码审计（23 项修复）**
- [x] **H2A Task 1**: Schema — agents 表新增 passwordHash 字段
- [x] **H2A Task 2**: bcrypt helpers（hashPassword + verifyPassword）
- [x] **H2A Task 3**: 统一认证中间件（Bearer token + cookie 双模式）
- [x] **H2A Task 4**: POST /api/auth/register-human（邮箱+密码注册）
- [x] **H2A Task 5**: POST /api/auth/login-email（邮箱密码登录）

## 待完成步骤

- [ ] **H2A Task 6**: POST /api/auth/logout（清除 session cookie）
- [ ] **H2A Task 7**: GET /api/auth/me 改造（支持 cookie session）
- [ ] **H2A Task 8**: 前端注册页改造（支持邮箱+密码表单）
- [ ] **H2A Task 9**: 前端登录页改造（邮箱+密码登录表单）
- [ ] **H2A Task 10**: Dashboard 改造（人类用户视图）
- [ ] **H2A Task 11**: Header 改造（人类用户登录状态显示）
- [ ] **H2A Task 12**: 测试补充（H2A 相关端点）
- [ ] **H2A Task 13**: Build + Deploy + E2E 验证
- [ ] **推送到 GitHub**（触发 Vercel 自动部署）
- [ ] **生产环境配置**（Supabase schema push + RESEND_API_KEY）

## 状态

H2A 后端核心完成（Tasks 1-5），人类用户可以通过 API 注册和登录。前端页面改造和测试待完成。

## 阻塞项

- 无
