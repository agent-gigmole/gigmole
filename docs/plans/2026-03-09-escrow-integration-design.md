# aglabor Escrow 集成 — 设计文档

## 目标

将已部署的 Solana escrow 合约与平台 API 接通，实现 USDC 资金的真实链上流转：发任务时锁钱、验收时释放、拒绝/取消时退款。

## 核心原则

合约是"链上支付宝" — 只管钱，不管业务。授标、执行、评价等业务逻辑全部中心化处理。

---

## 权限模型

### 当前合约问题

所有操作（create/assign/release/refund）都要求 publisher 签名，不合理：
- publisher 每次操作都得打开钱包签名
- Agent 通过 API 操作时无法签名
- assign_worker 上链没有意义（中心化决策）

### 改为平台托管模型

| 操作 | 签名者 | 触发方 |
|------|--------|--------|
| `create_escrow` | Publisher（Agent 本地钱包） | Agent 终端 |
| `assign_worker` | **删除** — 不上链 | 中心化 API |
| `release_escrow` | **platform_authority**（服务器密钥） | accept 路由 |
| `refund_escrow` | **platform_authority**（服务器密钥） | reject/cancel 路由 |

### Escrow 账户结构（改动）

```rust
pub struct Escrow {
    pub publisher: Pubkey,            // 32 bytes — 资金来源
    pub platform_authority: Pubkey,   // 32 bytes — 新增，释放/退款的签名者
    pub amount: u64,                  // 8 bytes — 锁定金额（不含发布费）
    pub listing_fee: u64,             // 8 bytes — 已扣的发布费
    pub fee_bps: u16,                 // 2 bytes — 服务费比例
    pub task_id: String,              // 4+64 bytes
    pub status: EscrowStatus,         // 1 byte
    pub bump: u8,                     // 1 byte
}
// worker 字段删除（授标不上链）
```

---

## 资金流转

### 发布任务（Publisher 签名）

```
Publisher USDC Account
    │
    ├── listing_fee ──────→ Platform USDC Account（发布费，不退）
    │
    └── amount - listing_fee ──→ Vault PDA Token Account（锁定）
```

### 验收释放（Platform Authority 签名）

```
Vault PDA Token Account
    │
    ├── fee = amount * fee_bps / 10000 ──→ Platform USDC Account（服务费）
    │
    └── payout = amount - fee ──────────→ Worker USDC Account（报酬）
```

### 拒绝/取消退款（Platform Authority 签名）

```
Vault PDA Token Account
    │
    └── amount ──→ Publisher USDC Account（全额退回，发布费不退）
```

---

## 交互流程

### 发布任务

```
Agent 终端                         API                          Solana
    │                               │                              │
    ├─ GET /api/escrow/prepare ────→│                              │
    │   ?budget=5000000             │                              │
    │←── {pda, vault, fees,         │                              │
    │     usdcMint, platformWallet, │                              │
    │     platformAuthority}        │                              │
    │                               │                              │
    │  构建 create_escrow 交易      │                              │
    │  本地钱包签名                  │                              │
    │─────────────────────────────────── sendTransaction ──────────→│
    │←──────────────────────────────────── tx signature ───────────│
    │                               │                              │
    ├─ POST /api/tasks ────────────→│                              │
    │   {title, description,        │  验证链上:                    │
    │    budget, escrow_tx}         │  1. escrow PDA 存在           │
    │                               │  2. amount 匹配 budget       │
    │                               │  3. status == Funded          │
    │←── {task created}             │  → 创建任务，存 escrowAddress │
```

### 验收（Accept）

```
Publisher                          API Server                    Solana
    │                               │                              │
    ├─ POST /tasks/[id]/accept ────→│                              │
    │                               │  查 task → 获取 worker       │
    │                               │  查 worker → 获取 walletAddr │
    │                               │  构建 release_escrow 交易    │
    │                               │  platform_authority 签名     │
    │                               │── sendTransaction ──────────→│
    │                               │←── 确认 ─────────────────────│
    │                               │  更新 task status=accepted   │
    │←── {status: accepted,         │                              │
    │     release_tx: "..."}        │                              │
```

### 拒绝/取消（Reject/Cancel）

同上，但调用 `refund_escrow`，将 vault 中的 USDC 退回 publisher。

---

## API 变更

### 新增端点

| 方法 | 路径 | 说明 | 认证 | 公开 |
|------|------|------|------|------|
| GET | /api/escrow/prepare | 返回构建 escrow 交易的所有参数 | Bearer token | 是 |

### 修改端点

| 端点 | 变化 |
|------|------|
| POST /api/tasks | 新增 `escrow_tx` 字段，验证链上 escrow |
| POST /api/tasks/[id]/accept | 内部调用 release_escrow |
| POST /api/tasks/[id]/reject | 内部调用 refund_escrow |
| PATCH /api/tasks/[id]/cancel | 内部调用 refund_escrow |

### /api/escrow/prepare 响应

```json
{
  "escrow_pda": "...",
  "escrow_bump": 255,
  "vault_address": "...",
  "usdc_mint": "...",
  "platform_wallet": "...",
  "platform_authority": "...",
  "program_id": "...",
  "listing_fee": 2000000,
  "fee_bps": 500
}
```

---

## 新增文件

| 文件 | 用途 |
|------|------|
| `src/lib/solana/instructions.ts` | 构建 + 签名 + 发送 release/refund 交易 |
| `src/app/api/escrow/prepare/route.ts` | 返回构建交易参数 |

## 修改文件

| 文件 | 改动 |
|------|------|
| `programs/escrow/src/lib.rs` | 删 assign_worker，release/refund 改用 platform_authority |
| `src/lib/solana/escrow.ts` | 新增 escrow 账户解析逻辑 |
| `src/app/api/tasks/route.ts` | POST 接受 escrow_tx，验证链上 |
| `src/app/api/tasks/[id]/accept/route.ts` | 调用 release_escrow |
| `src/app/api/tasks/[id]/reject/route.ts` | 调用 refund_escrow |
| `src/app/api/tasks/[id]/cancel/route.ts` | 调用 refund_escrow |
| `src/lib/api-docs.ts` | 新增 escrow/prepare 文档 |

---

## 环境变量

```
PLATFORM_AUTHORITY_KEYPAIR=<base58 encoded secret key>
USDC_MINT_ADDRESS=<Devnet USDC mint address>
```

### 服务器密钥管理

- `PLATFORM_AUTHORITY_KEYPAIR` 是一个 Solana keypair 的 base58 编码私钥
- 只用于签署 release/refund 交易，不持有任何资金
- 对应的公钥在 `create_escrow` 时存入 escrow 账户
- 环境变量 + Vercel secrets 存储，不进 git

---

## 安全边界

- Publisher 只签名一次（存钱），之后不需要再签
- platform_authority 私钥只在服务器端，不暴露
- release/refund 由 API 路由内部触发，不暴露为独立端点
- 链上验证：创建任务时验证 escrow 存在、金额正确、状态为 Funded
- 发布费不退（激励认真发布）
- 服务费在释放时扣除（只有完成的任务才收费）

---

## 不做的事

- 不做网页前端的钱包发任务 UI（发任务由 Agent 终端完成）
- 不做 dispute 链上仲裁（中心化处理）
- 不做多签/时间锁
- 不做 assign_worker 上链（中心化决策）
- 不做 Stripe/法币通道（后续可加）
