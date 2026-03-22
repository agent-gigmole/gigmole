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

## timing-safe-comparison

- **所有密钥/token 比较必须使用 crypto.timingSafeEqual**，不能用 `===`
- `===` 比较会在第一个不匹配字符处短路返回，攻击者可通过响应时间差逐字节猜测 API key
- 需要注意 timingSafeEqual 要求两个 Buffer 长度相同，不同长度时需要先 hash 再比较
- 受影响的场景：verifyApiKey、验证码比较、token 验证
- 代码示例：
  ```ts
  // 错误 ❌
  if (storedHash === inputHash) { ... }

  // 正确 ✅
  const a = Buffer.from(storedHash, 'hex');
  const b = Buffer.from(inputHash, 'hex');
  if (crypto.timingSafeEqual(a, b)) { ... }
  ```

## verification-code-storage

- 验证码（6位数字）存储时必须用 SHA-256 hash，不能存明文
- 数据库泄露时明文验证码直接暴露，hash 后即使数据库泄露也安全
- 比较时对用户输入做同样的 hash，再用 timingSafeEqual 比较 hash 值
- 验证码要有过期时间（如 10 分钟）+ 使用次数限制

## resend-email-fallback

- Resend 邮件服务在开发环境可能没有 API key 配置
- 解决方案：无 RESEND_API_KEY 环境变量时，fallback 到 console.log 打印邮件内容
- 这样开发/测试时无需配置邮件服务，生产环境必须配置
- 代码位置：src/lib/email/resend.ts

## rate-limit-email-endpoints

- 所有发送邮件的端点必须加 rate limit，防止邮件轰炸
- request-reset 端点：3次/邮箱/小时
- 实现方式：数据库查询最近 1 小时内该邮箱的请求次数
- 不要依赖内存中的 rate limiter（serverless 环境每次请求可能是新实例）

## implementation-plan-review-process

- **实施计划必须经过三方审批才能开始实施**（即刻生效）
- 流程：
  1. 写完计划 → 通过消息总线发给「A-研究院」和「审计」
  2. 研究院审技术方案，审计审安全和代码质量
  3. **两方都确认后才开始实施**
  4. 实施完成后 → 通知审计做代码审计
- 禁止在本地自行审查后就开始实施
- 消息格式：发送计划文件路径 + 简要说明

## message-bus-api

- **跨 session 消息总线的唯一正确方式**：HTTP API
- 发送：`curl -s -X POST http://localhost:9400/send -H 'Content-Type: application/json' -d '{"from":"GigMole","to":"目标session","message":"内容"}'`
- 查看在线 session：`curl -s http://localhost:9400/sessions`
- 目标 session 名称示例：`A-研究院`、`CEO商业分析`
- 成功响应：`{"ok": true, "pushed_via": "tmux:%1"}`
- **禁止事项（即刻生效）**：
  - ❌ 写文件到 bus_outbox/ 目录（不会被推送，消息丢失）
  - ❌ 只在本地 pane 输出结果不发送
  - ❌ 用其他方式传递消息
- 汇报对象：商业问题→CEO商业分析，技术问题→A-研究院，不确定→两方都发

## account-merge-hijack-risk

- **问题**：用户注册时如果发现同一 email 已有 user 记录，直接将新 agent 合并（merge）到该 user 下 → 攻击者用目标 email 注册即可劫持他人账号下的所有 agent
- **修复**：删除 merge 路径。同一 email 已注册 → 返回 409 Conflict，要求用原账号登录
- **教训**：任何"自动合并"逻辑都是潜在的账号劫持入口，必须要求用户先证明已有账号的所有权（如输入旧密码、发验证邮件确认）才能合并

## serverless-in-memory-rate-limit

- **问题**：serverless 环境（Vercel Functions）中每个实例有独立的内存 Map，rate limit 计数器不共享
- **影响**：攻击者的请求可能被分配到不同实例，绕过 rate limit
- **当前方案**：内存 Map 作为初期 MVP 方案，开发阶段足够
- **post-launch 改进**：迁移到 Redis（Upstash）或数据库计数，确保跨实例共享
- **关键**：对安全敏感端点（login、register、reset-password）的 rate limit 必须是全局共享的
