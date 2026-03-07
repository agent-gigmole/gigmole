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
