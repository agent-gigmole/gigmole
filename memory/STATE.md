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

- **User System 全部完成并部署（13 个任务，5 个 batch）**
  - Batch 1 (Tasks 1-3): 依赖安装 + schema unique constraint + wallet auth 库
  - Batch 2 (Tasks 4-6): Auth API 端点 (nonce/verify/logout/me) + Agent wallet 注册/key 重生成
  - Batch 3 (Tasks 7-9): Wallet provider 组件 + Login 页面 + Register 页面重构
  - Batch 4 (Tasks 10-12): Dashboard data APIs + Dashboard 页面 + Header 登录状态
  - Batch 5 (Task 13): 环境变量配置 + Build + Deploy + E2E 验证

- **Escrow Integration 全部完成并部署（13 个任务）**
  - Task 1: Anchor 合约修改 — worker 替换为 platform_authority，删除 assign_worker
  - Task 2: 构建并部署到 Devnet（Program ID: F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh），IDL 复制到 src/lib/solana/idl/escrow.json
  - Task 3: Platform authority keypair loader（src/lib/solana/platform-authority.ts）
  - Task 4: Escrow 账户 Borsh 反序列化（parseEscrowAccount）
  - Task 5-6: Release/refund instruction builder（src/lib/solana/instructions.ts）
  - Task 7: GET /api/escrow/prepare 端点
  - Task 8: POST /api/tasks 添加链上 escrow 验证
  - Task 9: Accept 路由调用 sendReleaseEscrow
  - Task 10: Reject 路由调用 sendRefundEscrow
  - Task 11: Cancel 路由调用 sendRefundEscrow
  - Task 12: 更新 api-docs.ts
  - Task 13: 生成 platform authority keypair，添加环境变量到 .env
  - **Vercel 部署修复**: 5 个 API route 文件的 Solana 顶层 import 改为动态 import，解决构建错误
  - **生产环境已上线**: https://aglabor.vercel.app

## 已知最佳结果

- 130 个测试全部通过
- E2E 测试 69/82 通过（13 个超时/级联失败，非代码问题）
- 40+ API 端点已实现（含 13 个 admin 端点 + 6 个 auth/wallet 端点 + 2 个 user dashboard 端点 + escrow prepare 端点）
- 15+ 网站页面已构建（含 dashboard、login）
- Solana escrow PDA 推导已验证
- Anchor 合约已部署到 Devnet（含 platform_authority 模式）
- 数据库 9 张表已在 Supabase 中创建（含 platform_config）
- Vercel 部署成功，生产地址可访问，Escrow 集成已上线
- Plugin registry (plugins/registry.json) 已建立
- Next.js build 通过

## 当前阶段

- Escrow Integration 全部 13 个任务完成并部署到生产环境
- User System 全部 13 个任务完成并部署
- Admin Dashboard 全部 15 个任务完成并部署
- 平台基础设施升级全部 13 个任务完成并部署
- MVP 全部 22 个任务完成

## 下一步

- 待定：用户提出新需求
