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
| referral / referredBy / 推荐人 / 分销 | DECISIONS.md#referral-commission-strategy |
| commission / 佣金 / off-chain / 结算 | DECISIONS.md#referral-commission-strategy |
| tagline / 品牌标语 / publisher / worker | DECISIONS.md#tagline-strategy |
| GigMole / 品牌 / 鼹鼠 / 传播性 | DECISIONS.md#brand-gigmole |
| 真实世界资源 / 粉丝 / 账号 / 数据 / 资源型 Agent | DECISIONS.md#brand-gigmole |
| bind-wallet / 签名消息 / 重放攻击 / 消息前缀 | GOTCHAS.md#bind-wallet-signature-message-separation |
| walletAddress! / 强制解包 / 降级处理 / walletWarning | GOTCHAS.md#accept-graceful-degradation |
| accept / 跳过 escrow / 无钱包 / graceful degradation | GOTCHAS.md#accept-graceful-degradation |
| email / 邮箱绑定 / API Key 恢复 / users 表 / Resend | DECISIONS.md#email-binding-architecture |
| 品牌重塑时序 / 邮件模板 / 先品牌后 email | DECISIONS.md#email-binding-architecture |
| Magic Link / 轮询 / 邮箱绑定方案 | DECISIONS.md#email-binding-architecture |
| gigmole.cc / 域名 / .cc | DECISIONS.md#brand-gigmole |
| agenthire.dev / 放弃 / 不续费 / 域名废弃 | DECISIONS.md#agenthire-dev-domain-deprecation |
| CEO 决策 / 全部确认 / 拍板 | DECISIONS.md#email-binding-architecture |
| 身份体系 / 三层 / Email / API Key / Wallet | DECISIONS.md#identity-three-layers |
| 安全审计 / code review / 修复 | DECISIONS.md#security-review-findings |
| timingSafeEqual / 时序攻击 / 密钥比较 | GOTCHAS.md#timing-safe-comparison |
| 验证码 / SHA-256 / hash 存储 / 不存明文 | GOTCHAS.md#verification-code-storage |
| Resend / fallback / console.log / 开发环境 | GOTCHAS.md#resend-email-fallback |
| rate limit / 邮件轰炸 / serverless / 数据库计数 | GOTCHAS.md#rate-limit-email-endpoints |
| users 表 / owner_id / 1:N / agents 分离 | DECISIONS.md#email-binding-architecture |
| email_bind_tokens / api_key_reset_tokens / 绑定流程 | DECISIONS.md#email-binding-architecture |
| user-service / email-verification-service / resend.ts | DECISIONS.md#email-binding-architecture |
| bind/[token] / 前端绑定页面 / Magic Link | DECISIONS.md#email-binding-architecture |
| Drizzle / 循环引用 / circular reference / FK / 外键 | drizzle-tips.md#circular-reference-fk |
| awardedBidId / tasks / bids / 双向引用 | drizzle-tips.md#circular-reference-fk |
| defaultNow / updatedAt / $onUpdate / 自动更新 | drizzle-tips.md#updated-at-on-update |
| ON UPDATE CURRENT_TIMESTAMP / PostgreSQL / MySQL 差异 | drizzle-tips.md#updated-at-on-update |
| relations / references / query builder / DDL | drizzle-tips.md#relations-vs-fk |
| 代码审计 / 23项修复 / decisions.md 对照 | (memory/LOG.md#2026-03-10) |
| 零摩擦注册 / name-only / 弱化钱包 | (memory/LOG.md#2026-03-10) |
| WalletProvider / 按需加载 / autoConnect false | (memory/LOG.md#2026-03-10) |
| services 层 / escrow-service / agent-service / 业务逻辑抽取 | (memory/LOG.md#2026-03-10) |
| award 状态机 / AWARDED 状态 / bug 修复 | (memory/LOG.md#2026-03-10) |
| verifyAttempts / emailAttempts / 计数器分离 | (memory/LOG.md#2026-03-10) |
| messages 鉴权 / Bearer token / 参与者验证 | (memory/LOG.md#2026-03-10) |
| /api/agents/me/tasks / /api/agents/me/bids / 程序化自查 | (memory/LOG.md#2026-03-10) |
| OpenAnt / 竞品分析 / competitor | competitor-openant.md |
| Agent Skills / 分发标准 / npx skills add / skill拆分 | competitor-openant.md#1-agent-skills-分发标准 |
| CLI-first / npm包 / --json / Agent友好 | competitor-openant.md#2-cli-first-设计 |
| 多链 / EVM / Base / viem | competitor-openant.md#3-多链策略 |
| 任务模式 / OPEN / APPLICATION / DISPATCH | competitor-openant.md#4-任务模式多样化 |
| AI自动验证 / 争议窗口 / 自动结算 | competitor-openant.md#5-ai自动验证 |
| Turnkey / 托管钱包 / 自托管差异化 | competitor-openant.md#6-钱包托管-turnkey |
| Agent Onboarding / application/agent+json / SEO | competitor-openant.md#7-网站seo优化 |
| Onboarding自动化 / 最小化交互 / join skill | competitor-openant.md#8-onboarding自动化 |
| session 注册表 / 人员能力 / 职责 / 协作 | session-registry.md |
| 实施计划审批 / 三方评审 / 研究院 / 审计 / 开始实施前 | GOTCHAS.md#implementation-plan-review-process |
| 消息总线 / message bus / bus_outbox / 跨session / localhost:9400 | GOTCHAS.md#message-bus-api |
| 冷启动 / cold start / 场景 / 垂直场景 | cold-start-scenarios.md |
| 量化回测 / backtest / 回测即服务 | cold-start-scenarios.md#1-量化回测即服务 |
| 社交媒体 / Twitter / 微博 / 小红书 / 资源型 Agent | cold-start-scenarios.md#2-社交媒体内容发布互动服务 |
| 分布式数据采集 / 爬虫 / 多源 | cold-start-scenarios.md#3-分布式数据采集 |
| 多语言 / 翻译 / 内容分发 | cold-start-scenarios.md#4-多语言内容分发 |
| 舆情监控 / 竞品监控 / 品牌监控 | cold-start-scenarios.md#5-竞品舆情监控 |
| AI 焦点小组 / Focus Group / 市场调研 / 用户记忆 | cold-start-scenarios.md#6-ai-焦点小组 |
| 双轮冷启动 / Dual-Wheel / 创始人自用 | cold-start-scenarios.md#7-双轮冷启动策略 |
| SaaS 插件 / 订阅 / 微服务市场 / 平台演进 | cold-start-scenarios.md#8-saas-插件平台演进 |
| OpenAnt / openant.ai / 竞品 / 0用户 | cold-start-scenarios.md#10-openant |
| 账号劫持 / merge / 合并 / hijack / 自动合并 | GOTCHAS.md#account-merge-hijack-risk |
| rate limit / serverless / 内存 Map / Vercel / 跨实例 | GOTCHAS.md#serverless-in-memory-rate-limit |
| Redis / Upstash / 全局 rate limit / 共享计数 | GOTCHAS.md#serverless-in-memory-rate-limit |
| H2A / 人类注册 / 邮箱密码 / register-human / login-email | (memory/LOG.md#2026-03-22) |
| passwordHash / bcrypt / 统一认证 / Bearer + cookie | (memory/LOG.md#2026-03-22) |
| pnpm / lockfile / 版本不匹配 / frozen-lockfile / Vercel install | GOTCHAS.md#pnpm-lockfile-version-mismatch |
| pnpm 9 / pnpm 10 / packageManager | GOTCHAS.md#pnpm-lockfile-version-mismatch |
| IPv6 / WSL2 / AAAA / pooler / ENETUNREACH | GOTCHAS.md#supabase-ipv6-wsl2-pooler |
| Supabase / 直连 / IPv6-only / 连接超时 | GOTCHAS.md#supabase-ipv6-wsl2-pooler |
| Cloudflare / 橙云 / 灰云 / DNS only / Proxied | GOTCHAS.md#cloudflare-vercel-proxy-conflict |
| SSL 冲突 / Vercel SSL / Cloudflare 代理 | GOTCHAS.md#cloudflare-vercel-proxy-conflict |
