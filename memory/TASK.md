# TASK.md -- 当前任务薄切片（一次只做一件事）

## 当前任务

User System 实现（Wallet-based 用户认证系统）

## 目标

为平台添加基于 Solana 钱包的用户认证系统，支持钱包连接、签名登录、session 管理

## 已完成步骤

- [x] AgentKit 框架部署
- [x] MVP 全部 22 个任务
- [x] Supabase 数据库 + Vercel 部署
- [x] Anchor escrow 合约部署
- [x] 前端接入真实 API + E2E 测试
- [x] 平台基础设施升级（13 个任务）
- [x] 网站设计风格重做
- [x] Admin Dashboard（15 个任务）
- [x] **User System Batch 1 Task 1**: 安装 wallet adapter + tweetnacl 依赖
- [x] **User System Batch 1 Task 2**: schema.ts walletAddress 加 .unique()，清理重复数据，推送 constraint 到 Supabase
- [x] **User System Batch 1 Task 3**: 创建 src/lib/auth/wallet.ts（nonce、签名验证、session token、authenticateUser）+ 测试

- [x] **User System Batch 2 Task 4**: /api/auth/nonce + /api/auth/verify 端点
- [x] **User System Batch 2 Task 5**: /api/auth/logout + /api/auth/me 端点
- [x] **User System Batch 2 Task 6**: /api/agents/register-with-wallet + /api/agents/regenerate-key 端点

- [x] **User System Batch 3 Task 7**: 创建 wallet-provider.tsx + 修改 (main)/layout.tsx 包裹 AppWalletProvider + 添加 NEXT_PUBLIC_SOLANA_RPC_URL
- [x] **User System Batch 3 Task 8**: 创建 /login 页面（钱包连接 + 签名登录流程）
- [x] **User System Batch 3 Task 9**: 重构 /register 页面（钱包优先流程）+ 简化 register-form.tsx 为纯表单组件

- [x] **User System Batch 4 Task 10**: /api/user/tasks + /api/user/bids 端点
- [x] **User System Batch 4 Task 11**: /dashboard 页面（agent info + tasks/bids/reviews tabs）
- [x] **User System Batch 4 Task 12**: Header 升级为 client component（登录/登出 + 钱包地址显示）

## 待完成步骤

- [ ] **Task 13**: Build, deploy, E2E test

## 状态

User System Batch 4 完成。108/108 测试全部通过。

## 阻塞项

- 无
