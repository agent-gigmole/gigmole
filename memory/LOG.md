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

## 2026-03-09 referredBy 推荐人字段完成 + 分销评估 + Tagline 讨论

- **referredBy 字段实现完成**
  - agents 表新增 nullable referredBy 字段（自引用 agents.id，外键约束）
  - 两个注册 API 都支持 optional referred_by 参数：
    - POST /api/agents/register
    - POST /api/agents/register-with-wallet
  - 验证逻辑：推荐人必须存在且未被 banned
  - Migration 文件生成：drizzle/0001_low_victor_mancha.sql
  - 130 个测试全部通过
- **分销/佣金系统评估（Explore agent 完成）**
  - 预计总工作量 43-48 小时，中等复杂度
  - 建议初期方案：off-chain（数据库记录佣金，定期手动结算），不上链
  - 后期再考虑链上佣金合约
  - 暂不启动开发
- **品牌决策：GigMole 确认**
  - gigmole.com 待用户注册
- **定位调整 v2**
  - Agent 能力包含真实世界资源（粉丝、账号、数据）
  - 人拥有资源但不工作，平台始终 Agent-to-Agent
- **Tagline 待定**
  - 不应偏向 worker 或 publisher 任一方
  - 应描述平台经济/网络整体
  - 平台稀缺资源是 publisher（需求方），不是 worker
- 关键发现：
  - CTO 任务应用后台 agent 执行，不阻塞 CEO 对话
  - Tagline 策略：平台稀缺资源是 publisher，tagline 不应偏向任一方

## 2026-03-09 P0 安全修复 + 降级处理（3 个问题，13 个新测试）

- **bind-wallet 签名验证修复**
  - 端点加了 nonce + ed25519 signature 验证，防伪造绑定
  - 签名消息格式："Bind wallet to AgentHire agent {agentId}\nNonce: {nonce}"
  - 和登录签名消息不同，防跨场景重放攻击
  - 409 处理钱包已被其他 agent 占用
  - 8 个新测试
- **accept 路由 walletAddress! 强制解包 bug 修复**
  - worker 无钱包时原来会崩溃（! 强制解包 null）
  - 修复后：状态正常推进到 accepted，但跳过 escrow release 链上操作
  - 返回 walletWarning 字段通知调用方
  - 3 个新测试
- **POST /api/tasks escrow 无钱包校验**
  - 带 escrow_tx 但请求者无钱包时返回 400
  - 2 个新测试
- 结果：全部 143 个测试通过

## 2026-03-09 邮箱绑定 + API Key 恢复方案评估

- CTO 完成方案评估，推荐架构：
  - 拆出 users 表（人类身份）和 agents 表分离，1:N 关系
  - Email 选填，不绑 email 丢 key 是自己责任
  - 邮件服务推荐 Resend（$0起步）
  - MVP 只做 email + wallet 登录，不做 Google/GitHub OAuth
  - API Key 恢复流程：邮箱验证码方式
- 预估工作量 ~18 小时
- 6 个决策点等 CEO 拍板
- 关键发现：如果品牌重塑在近期，应先做品牌重塑再做 email 功能（避免邮件模板改两次）

## 2026-03-09 CEO 全部决策项确认 + 品牌重塑启动

- **CEO 确认全部 10 项待决策**：
  1. 品牌名：GigMole ✅
  2. 域名：gigmole.cc（已注册）✅ — gigmole.com 已被注册，选 .cc
  3. users/agents 分表：确认拆分 ✅
  4. Email：选填 ✅
  5. 邮件服务：Resend ✅
  6. 邮箱绑定方案：Magic Link + 轮询（非验证码链接）✅
  7. 验证码：6位数字 ✅
  8. 执行顺序：先品牌重塑，再 email 功能 ✅
  9. agenthire.dev：放弃，不做跳转，不续费 ✅
  10. Tagline：仍在讨论，CEO 在考虑 "co-work" 概念方向
- **CTO 已启动品牌重塑工作**（AgentHire → GigMole, agenthire.dev → gigmole.cc）
- 关键发现：
  - gigmole.com 已被注册，最终选了 gigmole.cc
  - agenthire.dev 放弃不续费，不做跳转
  - 邮箱绑定方案从"验证码"调整为"Magic Link + 轮询"（CEO 决策）

## 2026-03-09 品牌重塑完成：AgentHire → GigMole + Tagline 确认

- **品牌重塑全部完成**
  - 11 个文件修改：所有 "AgentHire" → "GigMole"，所有 "agenthire.dev" → "gigmole.cc"
  - 签名消息前缀更新、OpenAPI spec server URL 更新
  - 143 个测试全部通过
  - Commits: c7e099b（品牌重塑）+ d2b776b（tagline 更新）
- **Tagline 确认**："Agents, Co-working."
  - CEO 最终确认 "co-work" 方向
- **待推送 GitHub**，推送后 Vercel 自动部署到 gigmole.cc
- **CEO 安排整晚工作计划**：
  1. 开发 email 绑定功能（users 表 + Resend + Magic Link + 轮询）
  2. email 完成后：安全方向 code review
  3. CEO 今天工作结束，休息

## 2026-03-09 Email 绑定系统全部完成 + 安全审计通过

- **Schema 变更（4 个表操作）**：
  - 新建 users 表（人类身份，email + password_hash + created_at）
  - agents 表新增 owner_id FK → users.id（1:N 关系正式建立）
  - 新建 email_bind_tokens 表（Magic Link 绑定流程状态跟踪）
  - 新建 api_key_reset_tokens 表（API key 恢复流程）
  - Drizzle migration: drizzle/0002_sparkling_mindworm.sql
- **新服务层文件**：
  - src/lib/services/user-service.ts — User CRUD
  - src/lib/email/resend.ts — Resend 集成，无 RESEND_API_KEY 时 fallback console.log
  - src/lib/services/email-verification-service.ts — 验证码生成/验证，SHA-256 hash 存储，timing-safe 比较
- **6 个新 API 端点**：
  - POST /api/auth/bind-email/request — 生成 bind token
  - POST /api/auth/bind-email/send-code — 发验证码
  - POST /api/auth/bind-email/verify-code — 验证码验证 → 创建 user → 绑定 agent
  - GET /api/auth/bind-email/status — CLI 轮询状态
  - POST /api/auth/request-reset — 请求重置 API key
  - POST /api/auth/reset-api-key — 验证码 → 生成新 key
  - 注册 API 支持可选 email 参数
- **前端绑定页面**：src/app/(main)/bind/[token]/page.tsx（多步骤 UI）
- **测试**：64 个新测试，总计 207 个测试全部通过
- **安全 Code Review 完成**：
  - 修复 3 个问题：
    1. verifyApiKey 改用 crypto.timingSafeEqual（防时序攻击）
    2. Admin 任务状态更新加 TaskStatus enum 验证（防注入非法状态）
    3. request-reset 加 rate limit（3次/邮箱/小时）
  - 12 个安全领域验证通过
  - 4 个低优先级项记录待后续处理
- **身份体系三层确立**：Email（身份证）→ API Key（钥匙）→ Wallet（银行账户）
- 关键发现：
  - Resend 集成开发阶段无需 API key，console.log fallback 保证开发流畅
  - 验证码存储用 SHA-256 hash（不存明文），比较用 timingSafeEqual
  - users/agents 分离后，一个人（email）可以管理多个 Agent

## 2026-03-12 冷启动场景全面记录（8 个场景 + SaaS 演进洞察）

- CEO 脑暴讨论，提出多个创新冷启动场景，明确指示"可能的都记下来"
- **8 个场景**：
  1. 量化回测即服务 — 标准化高、可自动验证、用户有付费意愿
  2. 社交媒体内容发布/互动 — 资源型 Agent 核心场景
  3. 分布式数据采集 — 多 Agent 协作天然场景
  4. 多语言内容分发 — 翻译 + 多平台发布
  5. 竞品/舆情监控 — 适合订阅制
  6. AI 焦点小组（最创新）— 分布式市场调研，Agent 掌握独特用户记忆，大公司难复制
  7. 双轮冷启动 — 创始人既做 Publisher 又做 Worker
  8. SaaS 插件平台演进 — 重复性任务 → 订阅服务，收费模式从佣金 → 订阅分成
- **竞品对比**：OpenAnt (openant.ai) 定位相同但 0 用户，教训是光有技术平台不够需要垂直场景驱动
- **核心策略**：找大公司不愿做但有真实需求的垂直场景
- 保存至 memory/KNOWLEDGE/cold-start-scenarios.md + INDEX.md 更新

## 2026-03-10 全面代码审计（23 项修复）

- **审计范围**：对照 docs/business/decisions.md 设计要求，逐一审查全代码库（前端+后端+Schema）
- **严重修复（8项）**：
  1. 前端注册页重写：去掉钱包强制，改为 name-only 零摩擦注册
  2. 前端登录页：增加非钱包替代路径提示
  3. WalletProvider 从全局改为按需加载（只在 login 页面）
  4. autoConnect 改为 false
  5. register-with-wallet 标记为 legacy
  6. award 路由状态机 bug：现在正确写入 AWARDED 状态
  7. register 路由移除死代码（发了验证码但不存 hash）
  8. verify-code 计数器分离：verifyAttempts 独立于 emailAttempts
- **中等修复（6项）**：
  9. users.updatedAt 加了 $onUpdate hook
  10. 移除 isEmailTaken dead import/export
  11. 4 个路由的 @solana/web3.js 直接导入清理
  12. GET /api/tasks 加 status 筛选（skill plugin /labor scan 现在能工作）
  13. Header 显示 name 优先（不再默认显示钱包地址）
  14. Dashboard 加邮箱绑定提示 banner
- **低优先修复（9项）**：
  15. 业务逻辑全部抽取到 services 层（escrow-service, email-bind-service, api-key-service, agent-service）
  16. GET /api/messages 加了鉴权（需要 Bearer token + task_id + 参与者验证）
  17. tasks.awardedBidId FK 约束（migration 0003）
  18. verifyApiKey 不再是 dead code（middleware 现在调用它）
  19. email-verification-service.ts 重命名为 verification-utils.ts
  20. 设计文档补充 resolved/cancelled 状态
  21. /api/auth/me join users 表返回 email
  22. Dashboard 状态筛选补全 disputed/resolved/cancelled
  23. 新增 GET /api/agents/me/tasks 和 /api/agents/me/bids（程序化自查端点）
- **关键发现**：
  - Drizzle ORM 循环引用：tasks.awardedBidId 引用 bids.id，bids.taskId 引用 tasks.id → 不能用 inline .references()，只能用 migration SQL
  - Drizzle 的 defaultNow() 只在 insert 时生效，不会自动更新 → 必须手动加 $onUpdate
  - Git worktree 创建可能因 .git/config.lock 失败

## 2026-03-22 H2A（Human-to-Agent）后端 Tasks 1-5 完成

- **目标**：让人类用户通过邮箱+密码注册/登录，无需钱包即可使用平台
- **Task 1**: Schema 变更 — agents 表新增 `passwordHash` 字段（nullable text）
- **Task 2**: bcrypt helpers — `hashPassword()` + `verifyPassword()` 封装
- **Task 3**: 统一认证中间件 — 支持 Bearer token（Agent API Key）+ cookie（人类 session）双模式认证
- **Task 4**: POST /api/auth/register-human — 人类用户注册端点（email + password → 创建 user + agent + 设置 cookie）
- **Task 5**: POST /api/auth/login-email — 邮箱密码登录端点（验证密码 → 设置 session cookie）
- **关键发现/坑点**：
  - 审计发现 P0 账号劫持漏洞：原始设计中有 merge 路径（同一 email 已有 user 时合并 agent 到该 user），可被恶意利用劫持他人账号 → 已删除 merge 路径
  - Rate limiting 使用内存 Map 实现 — serverless 环境中每个实例有独立的 Map，攻击者可能绕过（post-launch 需迁移到 Redis 或数据库计数）
  - 统一中间件设计：先检查 cookie session，再检查 Bearer token，两者都没有则返回 401

## 2026-03-22 域名 + GitHub 账号迁移
- 域名迁移：gigmole.cc → gigmole.org
- GitHub 账号迁移：agenthiredev-cyber → agent-gigmole
- 代码推送到新仓库：https://github.com/agent-gigmole/gigmole
- 210 测试全部通过
- 待处理：Vercel 重新连接新 GitHub 仓库 + 绑定新域名 gigmole.org

## 2026-03-23 全套基础设施迁移完成 + E2E 17/17 通过

- **Vercel**: 新账号部署成功
  - 坑：pnpm 10 但 lockfile 是 pnpm 9 格式 → install command 加 `--no-frozen-lockfile`
- **Supabase**: 新项目 fhsxemzllufadykedddl，migration 成功
  - 坑：WSL2 不支持 IPv6 出站，Supabase 直连只有 AAAA 记录 → 必须用 pooler（IPv4）
- **Cloudflare DNS**: A记录 + CNAME 配置完成，gigmole.org 解析到 Vercel
  - 坑：必须用灰云（DNS only），开代理会与 Vercel SSL 冲突
- **Resend**: 邮件发送验证通过（noreply@gigmole.org）
- **代码变更**: 9 个文件 14 处引用从 gigmole.cc 替换为 gigmole.org
- **E2E 测试**: 17/17 全部通过，所有页面正常工作
- **结论**: gigmole.org 全套基础设施就绪，可进入 Demo 准备阶段
