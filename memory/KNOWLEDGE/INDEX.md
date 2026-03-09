# INDEX.md -- 关键词索引（让 agent 快速命中经验）

<!-- 格式：关键词 -> 文件#锚点 -->
<!-- 每次往 KNOWLEDGE 写入新内容时，同步在此添加索引 -->

| 关键词 | 位置 |
|--------|------|
| 技术栈选型 | DECISIONS.md#tech-stack |
| 任务状态机 | DECISIONS.md#task-state-machine |
| 支付货币 | DECISIONS.md#payment-currency |
| Next.js / TypeScript | DECISIONS.md#tech-stack |
| Drizzle ORM | DECISIONS.md#tech-stack |
| USDC / Solana | DECISIONS.md#payment-currency |
| Supabase / pooler / prepared statements | GOTCHAS.md#supabase-pooler |
| postgres.js / prepare: false | GOTCHAS.md#supabase-pooler |
| 密码 / URL 编码 / %40 | GOTCHAS.md#supabase-password-encoding |
| drizzle-kit push / DDL / pooler | GOTCHAS.md#drizzle-kit-pooler |
| anchor-lang / blake3 / edition2024 / Rust | GOTCHAS.md#anchor-lang-edition2024 |
| Solana / platform-tools / Cargo 版本 | GOTCHAS.md#anchor-lang-edition2024 |
| submit / 权限 / 安全漏洞 / awardedBidId | GOTCHAS.md#submit-api-auth |
| Vercel / 冷启动 / 超时 / serverless | GOTCHAS.md#vercel-cold-start |
| drizzle-kit push / checkValue / replace / bug | GOTCHAS.md#drizzle-kit-push-checkvalue-bug |
| Supabase / CREATE TABLE / Node.js 脚本 / workaround | GOTCHAS.md#drizzle-kit-push-checkvalue-bug |
| admin / dashboard / route group / layout isolation | admin-dashboard.md#route-group-isolation |
| Next.js / route groups / (main) / nested layout | admin-dashboard.md#route-group-isolation |
| HMAC / session token / stateless auth / admin auth | admin-dashboard.md#hmac-tokens |
| token expiry / TTL / 24h | admin-dashboard.md#token-expiry |
| vercel env / newline / printf / echo | admin-dashboard.md#vercel-env-newline |
| USDC / lamports / basis points / bps / conversion | admin-dashboard.md#usdc-conversions |
| admin password / admin URL | admin-dashboard.md#admin-password |
| ban / unban / agent suspension / 403 | admin-dashboard.md#hmac-tokens |
| unique constraint / duplicate data / walletAddress | GOTCHAS.md#supabase-unique-constraint-duplicate-data |
| wallet auth / nonce / signature / tweetnacl | (src/lib/auth/wallet.ts) |
| user session / authenticateUser / cookie | (src/lib/auth/wallet.ts) |
| Anchor / discriminator / sha256 / instruction name | solana-escrow.md#anchor-discriminator |
| Borsh / deserialization / offset / u64 / i64 / PublicKey | solana-escrow.md#borsh-deserialization |
| platform authority / release / refund / escrow | solana-escrow.md#platform-authority |
| IDL / target / gitignore / manual copy | solana-escrow.md#idl-management |
| escrow PDA / seeds / findProgramAddressSync | solana-escrow.md#escrow-pda |
| escrow verification / getAccountInfo / lamports | solana-escrow.md#onchain-verification |
| PLATFORM_AUTHORITY_KEYPAIR / keypair / env | solana-escrow.md#env-vars |
| Vercel / Solana / dynamic import / bigint-buffer / Non-base58 | GOTCHAS.md#vercel-solana-dynamic-import |
| native addon / build scripts / Ignored build scripts | GOTCHAS.md#vercel-solana-dynamic-import |
| Collecting page data / top-level import / await import | GOTCHAS.md#vercel-solana-dynamic-import |
| @solana/web3.js / 构建失败 / 部署失败 | GOTCHAS.md#vercel-solana-dynamic-import |
