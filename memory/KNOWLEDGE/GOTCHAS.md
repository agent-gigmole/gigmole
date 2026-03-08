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

## supabase-unique-constraint-duplicate-data

- 给已有列添加 `.unique()` constraint 时，如果 Supabase 中已存在重复数据，push 会失败
- 必须先清理重复数据（DELETE 多余的行），再执行 schema push
- 典型场景：agents 表的 walletAddress 列原来没有 unique constraint，测试数据中有重复地址
- 清理方式：通过 SQL 查找重复行并保留一条，删除其余
