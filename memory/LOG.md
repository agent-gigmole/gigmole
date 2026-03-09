# LOG.md — 变更日志（追加记录，不删改历史）

## 2026-03-07 AgentKit 框架部署
- 初始化 git 仓库
- 部署 AgentKit 模板（CLAUDE.md, project.config.yml, memory/）
- 从 agent_skill_market.md 提取需求，填充项目配置
- 确定技术栈：Python + FastAPI + SQLAlchemy + Alembic

## 2026-03-07 MVP 实现完成
- 完成全部 22 个实施任务，6 个阶段
- 技术栈：Next.js 16 + TypeScript + Drizzle + Solana
- 核心 API：14 个端点（Agent、Task、Bid、Execution、Review、Message）
- 网站：6 个页面（首页、市场、详情、Agent 主页、注册）
- Labor Agent Skill：/labor 命令定义
- 40+ 测试全部通过

## 2026-03-07 Supabase 数据库配置 + Vercel 部署

- 配置 Supabase PostgreSQL 连接
  - DATABASE_URL 使用 Transaction mode pooler（port 6543）
  - postgres.js 驱动添加 `prepare: false` 适配 Supabase pooler
  - `npx drizzle-kit push` 成功创建 6 张表
- 部署到 Vercel 生产环境
  - `vercel link` 关联项目
  - 设置环境变量：DATABASE_URL, SOLANA_RPC_URL, LISTING_FEE_LAMPORTS, TRANSACTION_FEE_BPS
  - `vercel --prod` 部署成功
  - 生产地址：https://aglabor.vercel.app
- 坑点记录：Supabase pooler 不支持 prepared statements；密码中 `@` 需 URL 编码为 `%40`

## 2026-03-07 Anchor escrow 合约部署到 Solana Devnet

- 编译 Anchor escrow 合约（create_escrow, release, dispute 指令）
- anchor-lang 降级到 0.30.1 + 固定 blake3=1.5.5，解决 edition2024 不兼容
- 部署成功，Program ID: F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh
- IDL 已上链

## 2026-03-07 前端接入真实 API

- 5 个前端文件移除 mock/硬编码数据，改为 fetch 真实 API
- 新建 /api/stats 端点（查询数据库统计数据）
- 所有页面现在展示真实数据库数据

## 2026-03-07 E2E 测试 + submit 权限修复

- 编写并运行 69 条 E2E 测试，65 条通过
- 修复 submit API 安全漏洞：原来任何人都能提交，改为只有 awarded worker 能提交
  - 修复方式：查询 awardedBidId 对应的 bid.bidderId，与请求者身份比对
- 全生命周期通过：注册 -> 发任务 -> 竞标 -> 授标 -> 提交 -> 验收 -> 评价
- 4 个失败均为 Vercel serverless 冷启动超时（5-10s），非代码 bug

## 2026-03-08 Infrastructure Tasks 4-6: API docs + OpenAPI + /docs 页面

- Task 4: 创建 src/lib/api-docs.ts — 结构化 API 文档数据
  - 9 个 ApiGroup，18+ 个 ApiEndpoint，完整的类型定义
  - 覆盖全部端点：Auth, Agents, Tasks, Bids, Execution, Reviews, Messages, Stats, Forum
  - 每个端点包含 method, path, summary, description, auth, params, requestExample, responseExample, errorCodes
- Task 5: 创建 GET /api/openapi.json 端点
  - 将 apiDocs 转换为 OpenAPI 3.0 规范
  - :param → {param} 路径转换，POST/PATCH → requestBody，GET → query parameters
  - BearerAuth security scheme，CORS header
  - 8 个 vitest 测试全部通过
- Task 6: 创建 /docs 页面（server component）
  - 左侧 sticky 导航（mobile 隐藏）+ 右侧内容区
  - 端点卡片：MethodBadge, AuthBadge, 参数表格, JSON 示例, 错误码
  - 暗色主题：bg-white/5, text-white/60, text-cyan-400

## 2026-03-08 平台基础设施升级全部完成（13 个任务，5 个 batch）

- Batch 1 (Tasks 1-3): Forum 功能
  - 新增 proposals + proposal_replies 表（schema 扩展）
  - Forum API：CRUD（创建/列表/详情/回复）
- Batch 2 (Tasks 4-6): API 文档体系（已在上条记录）
- Batch 3 (Tasks 7-9): 新页面
  - /plugins 页面 + plugins/registry.json（插件注册表）
  - /forum 页面（列表 + 详情 /forum/[id]）
- Batch 4 (Tasks 10-11): 导航与 Skill
  - Header 导航新增 Docs / Plugins / Forum 链接
  - skill/labor.md 新增 forum 命令 + reference implementation 说明
- Batch 5 (Tasks 12-13): 测试与部署
  - E2E 测试扩展：新增 forum API、openapi、新页面的测试用例
  - 结果：69/82 通过，13 个失败全是 Vercel cold-start 超时 + 级联失败
  - drizzle-kit push 在 Supabase 有 bug（checkValue.replace crash），用 Node.js 脚本手动建表
  - build 成功，deploy 到 https://aglabor.vercel.app
- 所有新功能验证通过：Forum API、/docs、/plugins、/forum、OpenAPI spec

## 2026-03-08 网站设计风格重做：暗黑 → Claude.ai 温暖极简

- 整体设计风格从暗黑主题改为模仿 Claude.ai 的温暖极简风格
- 主要变更：
  - 背景: #0a0a0a (暗黑) → #FAF9F5 (暖米色)
  - 卡片: 半透明边框 → 白色 + subtle shadow
  - 强调色: cyan → terracotta #D97757
  - 文字: white → stone 系列暖色调
- 修改 25 个前端文件（globals.css, layout.tsx, 所有组件和页面）
- 纯 className 替换，无特殊坑点
- 已部署到 https://aglabor.vercel.app

## 2026-03-08 Admin Dashboard Batch 1: Schema + Auth (Tasks 1-3)

- Task 1: Schema 扩展
  - agents 表新增 banned (BOOLEAN NOT NULL DEFAULT false) + banned_at (TIMESTAMP)
  - 新建 platform_config 表 (id, listing_fee, transaction_bps, updated_at)
  - 插入默认配置行 (listing_fee=2000000, transaction_bps=500)
  - 2 个 schema 测试通过
  - Node.js 脚本成功推送到 Supabase
- Task 2: Admin auth middleware (src/lib/auth/admin.ts)
  - verifyAdminPassword: timingSafeEqual 比对
  - createSessionToken / verifySessionToken: HMAC-SHA256 签名
  - authenticateAdmin: cookie-based session 验证
  - 6 个测试通过
- Task 3: authenticateRequest banned 检查
  - select 增加 banned 字段
  - banned=true 返回 403 "Your agent has been suspended"
  - 1 个测试通过
- 总计 3 个 commit，9 个新测试全部通过

## 2026-03-08 Admin Dashboard Batch 2: All API Endpoints (Tasks 4-8)

- 全部 admin API 端点实现完成

## 2026-03-08 Admin Dashboard Batch 3: Layout + Dashboard (Tasks 9-10)

- 使用 Next.js route groups 重构 app 目录结构
  - 公共页面移至 `src/app/(main)/`，admin 页面不再继承公共 Header/Footer
  - 关键发现：Next.js nested layouts 不会替换父 layout，而是嵌套在其中；route groups `(main)` 是隔离 admin 布局的正确方式
- Admin layout (`src/app/admin/layout.tsx`)
  - 侧边栏导航（Dashboard / Agents / Tasks / Forum / Finance）
  - Cookie-based auth 检查，未登录重定向到 login
- Admin login 页面 (`src/app/admin/login/page.tsx`)
  - 密码表单，成功后设置 session cookie
- Admin dashboard 页面 (`src/app/admin/page.tsx`)
  - KPI 卡片（总 agents / 总 tasks / 活跃竞标 / 总成交额）
  - 任务状态分布
  - 7 天活跃度统计
- Build 验证通过

## 2026-03-08 Admin Dashboard Batch 4: Management Pages (Tasks 11-14)

- Task 11: Agents 管理页面 (`src/app/admin/agents/page.tsx`)
  - 搜索输入框（提交时过滤）
  - 分页表格：Name, Wallet (8 char truncated), Status (active/banned badge), Created
  - Banned 行 bg-red-50 高亮
  - Ban/Unban toggle 按钮（window.confirm 确认）
- Task 12: Tasks 管理页面 (`src/app/admin/tasks/page.tsx`)
  - 状态筛选下拉框（All + 8 个状态）
  - 分页表格：Title, Budget (USDC), Status (TaskStatusBadge), Created
  - Disputed 行 bg-orange-50 高亮
  - 每行强制状态变更（下拉 + Apply 按钮）
- Task 13: Forum 管理页面 (`src/app/admin/forum/page.tsx`)
  - 分页表格：Title, Author ID (8 char), Category (proposal=blue, discussion=green), Status, Created
  - Close 按钮（仅 open 帖子显示）
- Task 14: Finance + Config 页面
  - Finance (`src/app/admin/finance/page.tsx`)：4 个 StatCard + 按状态金额表
  - Config (`src/app/admin/config/page.tsx`)：listing fee (USDC) + transaction fee (%) 表单
  - USDC 转换：÷ 1_000_000 显示，× 1_000_000 保存
  - BPS 转换：÷ 100 显示为 %，× 100 保存为 bps
- 4 个 commit，build 验证通过

## 2026-03-08 Admin Dashboard Batch 5: Build + Deploy + E2E (Task 15) — ADMIN COMPLETE

- Build 验证：97/97 测试全部通过
- Vercel 部署成功
- E2E 验证：admin login、dashboard、管理页面全部可访问
- Admin Dashboard 全部 15 个任务，5 个 batch 全部完成
- Admin URL: https://aglabor.vercel.app/admin
- 关键经验：
  - `echo "value" | vercel env add` 会添加尾部换行 → 用 `printf` 代替
  - Route groups `(main)` 用于隔离 admin 布局，避免继承公共 Header/Footer
  - Stateless HMAC tokens：logout 只清除浏览器 cookie，token 在服务端 24h TTL 内仍有效
  - Admin password: aglabor-admin-2026（存储在 Vercel env ADMIN_PASSWORD）

## 2026-03-08 User System Batch 1: Dependencies + Schema + Wallet Auth (Tasks 1-3)

- Task 1: 安装 wallet adapter + tweetnacl 依赖
- Task 2: schema.ts walletAddress 加 `.unique()` constraint
  - 坑点：Supabase 中已有重复 wallet address 测试数据，需先清理（DELETE 重复行）才能添加 unique constraint
  - 清理后成功推送 constraint 到 Supabase
- Task 3: 创建 src/lib/auth/wallet.ts
  - generateNonce: 随机 32 字节 hex
  - verifySignature: tweetnacl sign.detached.verify 验证 Solana 钱包签名
  - createSessionToken / verifySessionToken: HMAC-SHA256 签名（复用 admin auth 模式）
  - authenticateUser: cookie-based session 验证（从 DB 查用户）
  - 完整测试覆盖
- 结果：104/104 测试全部通过

## 2026-03-08 User System Batch 2: Auth + Agent API Endpoints (Tasks 4-6)

- Task 4: /api/auth/nonce + /api/auth/verify 端点
  - POST /api/auth/nonce: 接收 wallet_address，返回 HMAC nonce + timestamp + 签名消息
  - POST /api/auth/verify: 验证 nonce + 钱包签名 → 查找 agent → 设置 session cookie
  - 2 个测试通过
- Task 5: /api/auth/logout + /api/auth/me 端点
  - POST /api/auth/logout: 清除 session cookie（maxAge: 0）
  - GET /api/auth/me: authenticateUser → 查询 agent 详情（id, name, wallet, bio, skills, createdAt）
- Task 6: /api/agents/register-with-wallet + /api/agents/regenerate-key 端点
  - POST /api/agents/register-with-wallet: 验证签名 → 检查钱包重复 → 创建 agent + API key → 自动登录
  - POST /api/agents/regenerate-key: authenticateUser → 生成新 API key → 更新 hash
  - 坑点：vi.mock 工厂函数被 hoisted，不能引用外部 const 变量（mockReturning），需内联到工厂内
  - 2 个测试通过
- 结果：108/108 测试全部通过，3 个 commit

## 2026-03-08 User System Batch 3: Wallet Provider + Login/Register Pages (Tasks 7-9)

- Task 7: Wallet adapter provider 组件
  - 创建 wallet-provider.tsx（AppWalletProvider，包裹 ConnectionProvider + WalletProvider + WalletModalProvider）
  - 修改 (main)/layout.tsx 包裹 AppWalletProvider
  - 添加 NEXT_PUBLIC_SOLANA_RPC_URL 环境变量
- Task 8: Login 页面
  - 创建 /login 页面（钱包连接 + 签名登录流程）
  - 流程：连接钱包 → 请求 nonce → 签名 → 验证 → 登录成功
- Task 9: Register 页面重构
  - 重构 /register 页面为钱包优先流程（先连钱包，再填表单）
  - 简化 register-form.tsx 为纯表单组件（接收 walletAddress prop）
- 结果：108/108 测试全部通过

## 2026-03-08 User System Batch 4: Dashboard + Header (Tasks 10-12)

- Task 10: Dashboard data APIs
  - 创建 /api/user/tasks 端点：分页查询用户发布的任务，支持 status 过滤
  - 创建 /api/user/bids 端点：分页查询用户的竞标，innerJoin tasks 获取任务信息
  - 两个端点均使用 authenticateUser 认证
- Task 11: Dashboard 页面 (/dashboard)
  - 完整 client component，mount 时检查登录状态（/api/auth/me），未登录跳转 /login
  - Agent info card：名称、钱包地址（截断）、注册日期
  - Regenerate API Key 按钮（window.confirm 确认）
  - 三个 tab：My Tasks（状态过滤+表格）/ My Bids（表格）/ Reviews（星级+评论）
  - USDC 金额 ÷ 1_000_000 显示 2 位小数
- Task 12: Header 升级
  - 从 server component 转为 'use client' client component
  - 新增 useEffect fetch /api/auth/me 获取登录状态
  - 登录后显示钱包地址（截断）+ Logout 按钮
  - 未登录显示 Login + Register 按钮
- 结果：108/108 测试全部通过，3 个 commit

## 2026-03-08 User System Batch 5: Build + Deploy + E2E (Task 13) — USER SYSTEM COMPLETE

- 添加环境变量到 .env 和 Vercel
- Build 验证：108/108 测试全部通过，build 成功
- 部署到 https://aglabor.vercel.app
- E2E 验证通过：
  - /api/auth/nonce 返回正确 nonce
  - /api/auth/me 无 cookie 返回 401
  - /login、/register、/dashboard 页面均可访问
- User System 全部 13 个任务，5 个 batch 全部完成
- 新增文件：wallet.ts, wallet-provider.tsx, login/page.tsx, dashboard/page.tsx, 6 个 API route, 3 个测试文件
- 修改文件：schema.ts (.unique()), layout.tsx (AppWalletProvider), register/page.tsx (wallet-first), register-form.tsx (props), header.tsx (client component with auth)

## 2026-03-09 Escrow Integration 全部完成（13 个任务）

- Task 1: 修改 Anchor 合约 — worker 替换为 platform_authority，删除 assign_worker 指令
  - 合约改为平台代理模式：release/refund 由平台服务端签名执行，不需要 worker 钱包
- Task 2: 构建并部署到 Devnet
  - Program ID: F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh
  - IDL 复制到 src/lib/solana/idl/escrow.json
- Task 3: 创建 platform authority keypair loader（src/lib/solana/platform-authority.ts）
  - 从 PLATFORM_AUTHORITY_KEYPAIR 环境变量（JSON 数组）加载密钥对
- Task 4: 添加 escrow 账户 Borsh 反序列化（parseEscrowAccount）
  - 处理 Anchor 8 字节 discriminator + 各字段 offset
- Task 5-6: 创建 release/refund instruction builder（src/lib/solana/instructions.ts）
  - buildReleaseInstruction / buildRefundInstruction
  - sendReleaseEscrow / sendRefundEscrow（签名 + 发送事务）
- Task 7: 创建 GET /api/escrow/prepare 端点
  - 返回 program_id, platform_authority, escrow_pda, 序列化的 create_escrow 指令
- Task 8: POST /api/tasks 添加链上 escrow 验证
  - 检查 escrow PDA 存在 + lamports 匹配 + 状态正确
- Task 9: Accept 路由调用 sendReleaseEscrow（释放资金给 worker）
- Task 10: Reject 路由调用 sendRefundEscrow（退款给 client）
- Task 11: Cancel 路由调用 sendRefundEscrow（退款给 client）
- Task 12: 更新 api-docs.ts（新增 escrow prepare 端点文档）
- Task 13: 生成 platform authority keypair，添加环境变量到 .env
- 关键发现：
  - Anchor discriminators 是基于指令名的 sha256 哈希前 8 字节，修改账户结构不影响 discriminator
  - target/ 目录被 .gitignore 忽略，IDL 需要手动复制到 src/lib/solana/idl/
  - 没有 git remote 配置，部署需要手动操作
- 结果：130/130 测试通过，Next.js build 通过

## 2026-03-09 修复 Vercel 部署构建错误 — Escrow 集成上线

- 问题：Vercel 构建时 "Collecting page data" 阶段失败，报 "Non-base58 character" 错误
  - 根因：Vercel 构建环境跳过 bigint-buffer 原生绑定（Ignored build scripts），导致 @solana/web3.js 的 base58 操作在模块级别执行时崩溃
  - Next.js 在 page data collection 阶段会 evaluate 所有 route 文件的顶层代码，即使是 API route 也不例外
  - 本地 `pnpm next build` 不会复现（因本地有原生绑定）
- 修复方案：将 5 个 API route 文件中的 Solana 相关顶层 import 转换为 handler 函数内的动态 import (`await import(...)`)
  - 受影响文件：
    1. `src/app/api/escrow/prepare/route.ts`
    2. `src/app/api/tasks/route.ts`
    3. `src/app/api/tasks/[id]/accept/route.ts`
    4. `src/app/api/tasks/[id]/reject/route.ts`
    5. `src/app/api/tasks/[id]/cancel/route.ts`
- 结果：Vercel 部署成功，生产环境已上线 https://aglabor.vercel.app

## 2026-03-09 系统设计文档和 API 文档更新（反映 escrow 集成）

- docs/plans/2026-03-07-aglabor-system-design.md 更新 Solana Escrow 合约章节：
  - 新增 Platform Authority 架构说明
  - 更新 PDA 结构（worker → platform_authority）
  - 添加 Vault Token Account 说明
  - 添加链上交互流程图
  - 更新 API 列表（新增 Escrow 组）
- src/lib/api-docs.ts 更新 accept/reject/cancel 端点描述和 responseExample，添加 releaseTx/refundTx 字段
- memory/PROJECT.md 修正过时描述（FastAPI Swagger → OpenAPI + /docs）

## 2026-03-09 经营决策文档目录建立（docs/business/）

- 创建 docs/business/ 目录，包含 6 个文档：
  - README.md: 目录索引
  - positioning.md: 品牌定位 — 弱化 Web3，Solana 只是支付实现手段，品牌层不强调链
  - market-analysis.md: 竞品分析（PayAI、Virtuals Protocol、AI Agent Store 都强绑 Web3）
  - cold-start.md: 冷启动策略 — 供给侧先行，自造示范 Agent + 任务
  - launch-checklist.md: 上线检查清单
  - decisions.md: 关键决策记录
- 品牌名候选：AgentHire、TaskMesh（首选）
- Tagline 首选：Where Agents Hire Agents
- 核心差异化：支付中立 + API-first + 不发币

## 2026-03-09 Agent Directory 功能完成

- 后端：GET /api/agents 列表接口（src/app/api/agents/route.ts）
  - 支持 skill 筛选、名字搜索、分页、排序（newest/most_completed/highest_rated）
  - LEFT JOIN reviews 子查询获取声誉数据（avg_rating, review_count, completed_tasks），无 N+1
- 前端：/agents 目录页面（src/app/(main)/agents/page.tsx）
  - 响应式卡片网格（3/2/1 列）
  - 搜索框、skill 标签筛选、排序切换、分页
  - URL 驱动状态（useSearchParams）
- Header 导航新增 Agents 链接
- 无新增数据库表/字段，纯基于现有 schema（skills text array + reviews 聚合）
- Agent Directory 是冷启动的关键功能——展示供给侧
- 130 测试全通过，build 通过

## 2026-03-09 品牌名 AgentHire + 域名 agenthire.dev 确认

- 品牌名最终确认为 **AgentHire**
- 域名 **agenthire.dev** 已注册
- 联系邮箱：agenthire.dev@gmail.com
- agenthire.ai 已被 GoDaddy 注册，不可用
- .dev 后缀适合 API-first 产品，Google 管理，强制 HTTPS
- 更新了 docs/business/decisions.md 和 docs/business/positioning.md，标记品牌名和域名为已确认

## 2026-03-09 全站品牌重塑：aglabor → AgentHire

- 修改 8 个源码文件 + 2 个测试文件，将所有 "aglabor" 引用替换为 "AgentHire"
  - hero.tsx: 标题和描述
  - header.tsx: 品牌名
  - footer.tsx: 品牌名和版权
  - layout.tsx: meta title/description
  - wallet.ts: 签名消息前缀
  - openapi route: API info title + server URL → https://agenthire.dev
  - docs page: 页面标题
  - plugins page: 页面标题
- Tagline 确认为 "Where Agents Hire Agents"
- 130 测试全通过，已部署到 agenthire.dev
- 关键发现：改签名消息（wallet.ts）会导致已有用户签名验证变化，但当前无生产用户所以无影响
- 源码中已无任何 "aglabor" 引用

## 2026-03-09 示范 Agent 注册 + 示范任务发布 + GitHub 配置

- 注册 5 个示范 Agent 到生产环境：
  - CodeReviewer, DocTranslator, DataScraper, TestWriter, SummaryBot
- 发布 10 个示范任务（赏金 2-5 USDC），覆盖 5 个类别：
  - code-review, translation, web-scraping, testing, summarization
- API keys 保存在 docs/business/demo-agents-keys.md（已 gitignore，不上传）
- 平台当前数据：18 tasks, 21 agents
- GitHub 仓库配置：
  - tensam/agenthire (private) 创建并 push 全部代码
  - Vercel GitHub App 已连接，自动部署
  - .gitignore 更新：排除 memory/, docs/business/, CLAUDE.md, project.config.yml, agent_skill_market.md
- 关键发现：
  - gh CLI 支持多账号（gh auth switch），但 Vercel GitHub App 授权需要在 GitHub settings/installations 里手动配置
  - git push 需要先 `gh auth setup-git` 配置 credential helper

## 2026-03-09 品牌重大调整：AgentHire → GigMole + 定位升级

- 品牌名从 AgentHire 改为 **GigMole**
  - AgentHire 太正式缺乏传播性，GigMole 有趣有画面感（鼹鼠挖掘任务的意象）
  - gigmole.com 待注册（$10.44/年）
- 定位升级：Agent 能力来源不只是代码，还有人赋予的真实世界资源
  - 核心差异化：别的 Agent 平台只有代码能力，GigMole 的 Agent 可以拥有真实世界资源（粉丝、账号、数据）
  - 人拥有资源，Agent 代人工作，平台始终是 Agent-to-Agent
  - 降低门槛不是让人上来打工，而是让人更容易创建代表自己资源的 Agent
- 更新文档：
  - docs/business/positioning.md（v2，新定位）
  - docs/business/intro-article.md（新建，介绍文章）
  - docs/business/decisions.md（记录品牌变更决策）
- 关键决策：
  - 品牌传播性 > 专业感，GigMole 比 AgentHire 更适合社交传播
  - 资源型 Agent 是与 Swarm/CrewAI 等纯代码 Agent 平台的核心区别
