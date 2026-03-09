# TASK.md -- 当前任务薄切片（一次只做一件事）

## 当前任务

无 — 等待新需求

## 目标

Escrow Integration 全部完成。等待下一个任务。

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
- [x] **Escrow Integration Task 1**: 修改 Anchor 合约 — worker 替换为 platform_authority，删除 assign_worker
- [x] **Escrow Integration Task 2**: 构建并部署到 Devnet，IDL 复制到 src/lib/solana/idl/escrow.json
- [x] **Escrow Integration Task 3**: 创建 platform authority keypair loader
- [x] **Escrow Integration Task 4**: 添加 escrow 账户 Borsh 反序列化（parseEscrowAccount）
- [x] **Escrow Integration Task 5-6**: 创建 release/refund instruction builder
- [x] **Escrow Integration Task 7**: 创建 GET /api/escrow/prepare 端点
- [x] **Escrow Integration Task 8**: POST /api/tasks 添加链上 escrow 验证
- [x] **Escrow Integration Task 9**: Accept 路由调用 sendReleaseEscrow
- [x] **Escrow Integration Task 10**: Reject 路由调用 sendRefundEscrow
- [x] **Escrow Integration Task 11**: Cancel 路由调用 sendRefundEscrow
- [x] **Escrow Integration Task 12**: 更新 api-docs.ts
- [x] **Escrow Integration Task 13**: 生成 platform authority keypair，添加环境变量到 .env — ALL COMPLETE

## 待完成步骤

无

- [x] **Vercel 部署修复**: Solana 顶层 import 改为动态 import，构建成功，生产环境已上线
- [x] **经营决策文档**: 创建 docs/business/ 目录，6 个文档（定位、竞品、冷启动、上线清单、决策记录）

## 状态

Escrow Integration 全部 13 个任务完成并部署到生产环境。130/130 测试通过。Vercel 部署成功。经营决策文档已建立。

## 阻塞项

- 无
