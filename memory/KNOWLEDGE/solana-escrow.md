# Solana Escrow Integration 经验

## Anchor Discriminator 机制 {#anchor-discriminator}

Anchor 的 instruction discriminator 是基于**指令名**的 sha256 哈希前 8 字节，格式为 `sha256("global:<instruction_name>")` 的前 8 字节。修改账户结构（如删除字段、添加字段）不影响 discriminator，只有修改指令名才会改变。

Account discriminator 类似，格式为 `sha256("account:<AccountName>")` 的前 8 字节。

## Borsh 反序列化偏移量 {#borsh-deserialization}

从链上读取 Anchor 账户数据时，需要手动处理 Borsh 反序列化：
- 前 8 字节为 Anchor account discriminator，跳过
- PublicKey: 32 字节
- u64: 8 字节（小端序）
- u8（enum）: 1 字节
- i64（timestamp）: 8 字节（小端序）

使用 `Buffer.readBigUInt64LE()` 读 u64，`Buffer.readBigInt64LE()` 读 i64。

## Platform Authority 模式 {#platform-authority}

合约设计为 platform authority 模式：
- `create_escrow`: client 创建 escrow PDA，锁定 SOL
- `release`: 由 platform_authority 签名，将资金释放给 worker
- `refund`: 由 platform_authority 签名，将资金退还给 client
- 无需 worker 在链上签名，简化了流程

Platform authority keypair 以 JSON 数组格式存储在 `PLATFORM_AUTHORITY_KEYPAIR` 环境变量中。

## IDL 管理 {#idl-management}

`target/` 目录被 `.gitignore` 忽略，编译后的 IDL (`target/idl/escrow.json`) 不会被 git 追踪。需要手动复制到 `src/lib/solana/idl/escrow.json` 供前端/后端使用。

每次合约修改后重新编译，都需要手动复制 IDL。

## Escrow PDA 推导 {#escrow-pda}

Escrow PDA seeds: `[b"escrow", client_pubkey.as_ref(), task_id.as_bytes()]`

在 TypeScript 中：
```ts
PublicKey.findProgramAddressSync(
  [Buffer.from("escrow"), clientPubkey.toBuffer(), Buffer.from(taskId)],
  programId
)
```

## 链上验证要点 {#onchain-verification}

创建任务时验证 escrow：
1. 使用 `connection.getAccountInfo(escrowPda)` 获取链上数据
2. 检查 account 存在
3. 反序列化验证 lamports 匹配预算
4. 验证 escrow 状态为 Active (0)

## 环境变量 {#env-vars}

- `PLATFORM_AUTHORITY_KEYPAIR`: JSON 数组格式的 Solana keypair（64 字节）
- `SOLANA_RPC_URL`: Solana RPC 端点（devnet: https://api.devnet.solana.com）
- `NEXT_PUBLIC_SOLANA_RPC_URL`: 前端用的 RPC 端点
