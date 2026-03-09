# GOTCHAS.md -- 坑点 / 怪癖 / 踩雷记录

<!-- 本项目中发现的非直觉行为、隐藏陷阱 -->
<!-- 每条用 ## 锚点标题，方便 INDEX 引用 -->

## supabase-pooler

- Supabase pooler（Transaction mode, port 6543）**不支持 prepared statements**
- 使用 postgres.js 驱动时必须加 `{ prepare: false }` 选项，否则查询会报错
- 代码位置：`src/lib/db/index.ts`
- 相关代码：`const client = postgres(connectionString, { prepare: false })`

## supabase-password-encoding

- 如果 Supabase 数据库密码中含有 `@` 符号，在 DATABASE_URL 连接串中必须 URL 编码为 `%40`
- 否则 URL 解析会把 `@` 误认为用户信息与主机名的分隔符，导致连接失败

## drizzle-kit-pooler

- `drizzle-kit push` 可以直接通过 Supabase pooler 连接执行 DDL（建表等操作）
- 不需要使用 direct connection（port 5432），pooler 连接（port 6543）即可

## anchor-lang-edition2024

- anchor-lang 0.32.0 依赖 blake3 1.8.3，后者使用 Rust edition2024
- Solana platform-tools 内置的 Cargo 版本为 1.84.0，不支持 edition2024
- 解决方案：降级到 anchor-lang 0.30.1 + 在 Cargo.toml 中固定 blake3 = "=1.5.5"
- 这样可以正常编译并部署到 Devnet

## submit-api-auth

- Submit API（任务提交端点）原来没有验证提交者身份，任何人都能提交 -- 安全漏洞
- 修复方式：查询任务的 awardedBidId，找到对应 bid 的 bidderId，与请求者身份比对
- 只有被授标的 worker（awarded bidder）才能提交工作成果

## vercel-cold-start

- Vercel serverless 函数冷启动约 5-10 秒
- E2E 测试中 curl 需要设置 `--max-time 30`，否则容易超时
- 4 个 E2E 测试失败均因冷启动超时，非代码 bug
- 连续请求（函数已热）则响应很快

## drizzle-kit-push-checkvalue-bug

- `drizzle-kit push` 在 Supabase 上可能触发 `checkValue.replace is not a function` 错误
- 这是 drizzle-kit 内部 bug，与 Supabase 的 check constraint 格式不兼容
- **Workaround**: 跳过 drizzle-kit push，直接用 Node.js 脚本通过 postgres.js 执行 CREATE TABLE SQL
- 从 schema 定义手动写对应的 SQL（包括 enum 类型、表结构、索引）
- 示例：`node -e "const pg = require('postgres'); const sql = pg(process.env.DATABASE_URL, {prepare:false}); await sql\`CREATE TABLE ...\`; await sql.end()"`
- 这个 bug 在新增表时容易触发（已有表不受影响），因为 drizzle-kit 会 introspect 现有 schema 并处理 check constraints

## vercel-solana-dynamic-import

- **问题**: Vercel 构建环境跳过原生绑定（`Ignored build scripts`），导致 `bigint-buffer` 缺失。`@solana/web3.js` 在模块加载时会执行 base58 操作，触发 `Non-base58 character` 错误
- **触发时机**: Next.js 构建的 "Collecting page data" 阶段会 evaluate 所有 route 文件的**顶层代码**，即使是 API route 也不例外
- **本地不可复现**: `pnpm next build` 在本地不会出错，因为本地有原生绑定。只在 Vercel 构建环境中出现
- **修复方案**: 将 `@solana/web3.js`、`@solana/spl-token`、`@/lib/solana/*` 的 import 从顶层移到 handler 函数内部，使用 `await import(...)` 动态加载
  ```ts
  // 错误 ❌ — 顶层 import 会在 page data collection 时执行
  import { Connection } from '@solana/web3.js';

  // 正确 ✅ — handler 内动态 import，只在请求时执行
  export async function POST(req: Request) {
    const { Connection } = await import('@solana/web3.js');
    // ...
  }
  ```
- **受影响文件（本项目 5 个）**:
  - `src/app/api/escrow/prepare/route.ts`
  - `src/app/api/tasks/route.ts`
  - `src/app/api/tasks/[id]/accept/route.ts`
  - `src/app/api/tasks/[id]/reject/route.ts`
  - `src/app/api/tasks/[id]/cancel/route.ts`
- **推广规则**: 任何依赖原生绑定（native addon）的包，在 Vercel API route 中都应使用动态 import，避免构建阶段加载

## supabase-unique-constraint-duplicate-data

- 给已有列添加 `.unique()` constraint 时，如果 Supabase 中已存在重复数据，push 会失败
- 必须先清理重复数据（DELETE 多余的行），再执行 schema push
- 典型场景：agents 表的 walletAddress 列原来没有 unique constraint，测试数据中有重复地址
- 清理方式：通过 SQL 查找重复行并保留一条，删除其余

## bind-wallet-signature-message-separation

- **签名消息必须和登录签名消息不同**，防止跨场景重放攻击
- 登录签名消息格式：`Sign in to AgentHire\nNonce: {nonce}`
- bind-wallet 签名消息格式：`Bind wallet to AgentHire agent {agentId}\nNonce: {nonce}`
- 如果两者用同一格式，攻击者可以用登录签名来伪造绑定操作
- 每个需要钱包签名验证的场景都应有独立的消息前缀

## accept-graceful-degradation

- accept 路由原来用 `walletAddress!` 强制解包 worker 的钱包地址，worker 无钱包时会崩溃
- 修复为降级处理模式：状态推进（awarded → accepted）但跳过链上 escrow release 操作
- 返回 `walletWarning` 字段通知调用方 worker 尚未绑定钱包
- 这种降级设计适用于：链上操作是可选的增强功能，核心业务流程不应因链上依赖而阻塞
- 类似的设计也应用于 POST /api/tasks：带 escrow_tx 但请求者无钱包时返回 400（前置校验）
