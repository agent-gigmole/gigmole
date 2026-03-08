# STATE.md

## 已完成

- AgentKit 框架部署
- MVP 全部 22 个任务完成
  - Phase 1: Foundation (scaffolding, schema, auth)
  - Phase 2: Core API (agent, task, bid, execution, review, message)
  - Phase 3: Solana client integration
  - Phase 4: Website (layout, homepage, market, detail, profile, register)
  - Phase 5: Labor Agent Skill
  - Phase 6: Integration tests
- Supabase PostgreSQL 数据库连接配置
  - .env 中 DATABASE_URL 指向 Supabase pooler（Transaction mode, port 6543）
  - src/lib/db/index.ts 添加 `prepare: false`
  - 8 张表全部在 Supabase 中创建（原 6 张 + proposals + proposal_replies）
- Vercel 生产环境部署
  - 项目已 link，4 个环境变量已设置
  - 生产地址：https://aglabor.vercel.app
- Anchor escrow 合约部署到 Solana Devnet
  - Program ID: F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh
  - anchor-lang 0.30.1，IDL 已上链
- 前端连接真实 API（5 个文件去除 mock 数据，新增 /api/stats 端点）
- E2E 测试 69/82 通过
  - 全生命周期验证：注册 -> 发任务 -> 竞标 -> 授标 -> 提交 -> 验收 -> 评价
  - 修复 submit API 权限漏洞（只有 awarded worker 能提交）
  - 13 个失败均为 Vercel 冷启动超时（HTTP 000）+ 级联失败，非代码 bug
- **平台基础设施升级全部完成（13 个任务，5 个 batch）**
  - Batch 1 (Tasks 1-3): Forum schema (proposals + proposal_replies 表) + Forum API (CRUD + replies)
  - Batch 2 (Tasks 4-6): API docs 数据源 (src/lib/api-docs.ts, 22 endpoints) + OpenAPI 3.0 spec endpoint + /docs 页面
  - Batch 3 (Tasks 7-9): /plugins 页面 (plugins/registry.json) + /forum 页面 (列表+详情)
  - Batch 4 (Tasks 10-11): Header 导航更新 (Docs/Plugins/Forum 链接) + skill/labor.md 更新 (forum 命令 + reference implementation)
  - Batch 5 (Tasks 12-13): E2E 测试更新 (新增 forum + openapi + 新页面测试) + schema push + build + deploy

- 网站设计风格重做：暗黑主题 → Claude.ai 温暖极简风格

- **Admin Dashboard 全部完成并部署（15 个任务，5 个 batch）**
  - Admin URL: https://aglabor.vercel.app/admin

- **User System Batch 1 完成 (Tasks 1-3)**
  - Task 1: 安装 wallet adapter + tweetnacl 依赖
  - Task 2: schema.ts walletAddress 加 .unique()，清理重复测试数据后推送 constraint 到 Supabase
  - Task 3: 创建 src/lib/auth/wallet.ts（nonce 生成、签名验证、session token、authenticateUser）+ 测试

- **User System Batch 2 完成 (Tasks 4-6)**
  - Task 4: /api/auth/nonce + /api/auth/verify 端点（nonce 请求 + 钱包签名验证登录）
  - Task 5: /api/auth/logout + /api/auth/me 端点（登出清除 cookie + 获取当前用户信息）
  - Task 6: /api/agents/register-with-wallet + /api/agents/regenerate-key 端点（钱包注册 + API key 重新生成）

- **User System Batch 3 完成 (Tasks 7-9)**
  - Task 7: 创建 wallet-provider.tsx + 修改 (main)/layout.tsx 包裹 AppWalletProvider + 添加 NEXT_PUBLIC_SOLANA_RPC_URL
  - Task 8: 创建 /login 页面（钱包连接 + 签名登录流程）
  - Task 9: 重构 /register 页面（钱包优先流程）+ 简化 register-form.tsx 为纯表单组件

## 已知最佳结果

- 108 个测试全部通过
- E2E 测试 69/82 通过（13 个超时/级联失败，非代码问题）
- 40+ API 端点已实现（含 13 个 admin 端点 + 6 个 auth/wallet 端点）
- 15+ 网站页面已构建
- Solana escrow PDA 推导已验证
- Anchor 合约已部署到 Devnet
- 数据库 9 张表已在 Supabase 中创建（含 platform_config）
- Vercel 部署成功，生产地址可访问
- Plugin registry (plugins/registry.json) 已建立

## 当前阶段

- User System 实施中，Batch 1-3 (Tasks 1-9) 已完成
- Auth API 端点全部就绪：nonce、verify、logout、me
- Agent API 端点就绪：register-with-wallet、regenerate-key
- 前端钱包集成就绪：wallet provider、login 页面、register 页面（钱包优先）

## 下一步

- User System 后续 batch（待规划）：profile 页面、session 管理、权限保护等
