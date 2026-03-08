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

## 待完成步骤

- [ ] User System Batch 2: Wallet 连接前端 + 登录/注册 API 端点
- [ ] User System 后续 batch（待规划）

## 状态

User System Batch 1 完成。104/104 测试全部通过。

## 阻塞项

- 无
