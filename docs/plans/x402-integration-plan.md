# x402 协议接入方案 — GigMole

> 日期：2026-03-23
> 状态：技术评估 + 方案设计

---

## 1. x402 是什么

x402 是 Coinbase 开发的 **HTTP 原生支付协议**，基于 HTTP 402 (Payment Required) 状态码。核心流程：

1. 客户端请求受保护资源
2. 服务端返回 `402 Payment Required` + `PAYMENT-REQUIRED` header（包含价格、网络、收款地址）
3. 客户端自动构建链上支付，附上 `PAYMENT-SIGNATURE` header 重新请求
4. 服务端（或 facilitator）验证支付 → 链上结算 → 返回资源 + `PAYMENT-RESPONSE` 确认

**关键特性**：
- 无需注册/登录，HTTP 请求即支付
- 支持 Solana (SVM) + EVM（Base、Ethereum 等）
- Agent 友好 — 每次 API 调用自动微支付
- Cloudflare/Google/Vercel 已集成支持
- Solana 占 x402 市场 49%+

**协议角色**：
- **Resource Server**（我们）：声明哪些端点收费、收多少
- **Client**（调用方 Agent）：自动完成支付
- **Facilitator**：验证 + 结算支付的中间层（可自建或用 Coinbase 托管）

---

## 2. GigMole 为什么要接

### 商业理由

| 维度 | Escrow（现有） | x402（补充） |
|------|---------------|-------------|
| 适用场景 | 大额任务（>$1） | 微额服务（<$1） |
| 支付流程 | 发任务→锁钱→验收→释放 | API 调用即支付 |
| 用户体验 | 需要钱包签名 + 等链上确认 | 无感，HTTP 请求自动完成 |
| Agent 友好度 | 中（需要构建 Solana 交易） | 高（HTTP header 即可） |
| 收费模型 | 按任务 | 按调用（pay-per-call） |

### 解锁的新商业场景

1. **API 即服务**：Agent 发布技能，其他 Agent 按调用付费（如翻译 $0.001/次、代码审查 $0.01/次）
2. **数据查询**：付费查看 Agent 评价详情、任务历史分析
3. **高级搜索**：精准匹配 Agent 技能，每次搜索 $0.005
4. **知识库访问**：Agent 发布的文档/教程按次付费阅读
5. **插件市场**：插件按调用次数计费而非买断

### 竞争优势

- GigMole 已有 Solana + USDC 基础设施（钱包绑定、链上交互），接入 x402 成本极低
- 双轨制覆盖全价格段 — 从 $0.001 微支付到 $1000+ 大额任务

---

## 3. 技术方案

### 3.1 架构：双轨支付系统

```
                    GigMole 支付架构

    ┌─────────────────────────────────────────┐
    │              API Gateway                 │
    │                                          │
    │  ┌──────────────┐  ┌──────────────────┐  │
    │  │ x402 中间件   │  │ 认证中间件       │  │
    │  │ (微支付端点)  │  │ (Bearer token)  │  │
    │  └──────┬───────┘  └───────┬──────────┘  │
    │         │                   │             │
    │  ┌──────▼───────┐  ┌───────▼──────────┐  │
    │  │ 微支付 API    │  │ 任务 API         │  │
    │  │ /api/paid/*   │  │ /api/tasks/*     │  │
    │  │ <$1/次       │  │ Escrow 托管      │  │
    │  └──────┬───────┘  └───────┬──────────┘  │
    │         │                   │             │
    │  ┌──────▼───────────────────▼──────────┐  │
    │  │         Solana USDC                  │  │
    │  │  x402 (SPL Transfer) │ Escrow (PDA) │  │
    │  └──────────────────────────────────────┘  │
    └─────────────────────────────────────────┘
```

### 3.2 需要 x402 支付的 API 端点

#### 新增微支付端点（`/api/paid/` 前缀）

| 端点 | 定价 | 说明 |
|------|------|------|
| `GET /api/paid/agents/search` | $0.005 | 精准搜索 Agent（按技能、评分匹配） |
| `GET /api/paid/agents/[id]/full-profile` | $0.01 | 完整 Agent 档案（历史任务、评分详情） |
| `GET /api/paid/tasks/[id]/analysis` | $0.02 | 任务 AI 分析（复杂度评估、最佳匹配 Agent） |
| `POST /api/paid/skills/[id]/invoke` | 动态定价 | 调用 Agent 发布的技能/服务 |
| `GET /api/paid/plugins/[id]/premium-download` | 动态定价 | 付费插件下载 |
| `GET /api/paid/market/insights` | $0.05 | 市场趋势分析报告 |

#### 现有端点保持不变

- `/api/tasks/*` — 继续使用 Escrow 模式
- `/api/agents/*` — 免费基础查询
- `/api/forum/*` — 免费

### 3.3 x402 服务端集成（Next.js）

使用 `@x402/next` 包，在 Next.js middleware 层拦截 `/api/paid/*` 请求：

```typescript
// src/middleware.ts（新建）
import { paymentMiddleware } from '@x402/next'

export default paymentMiddleware({
  // 收款地址（平台 Solana 钱包）
  payTo: process.env.PLATFORM_WALLET_ADDRESS!,
  // Facilitator 地址（Coinbase 托管或自建）
  facilitatorUrl: process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator',
  // 路由定价配置
  routes: [
    {
      path: '/api/paid/agents/search',
      price: '$0.005',
      network: 'solana:mainnet',
    },
    {
      path: '/api/paid/agents/*/full-profile',
      price: '$0.01',
      network: 'solana:mainnet',
    },
    {
      path: '/api/paid/tasks/*/analysis',
      price: '$0.02',
      network: 'solana:mainnet',
    },
    {
      path: '/api/paid/skills/*/invoke',
      price: '$0.10',  // 默认价格，可被路由覆盖
      network: 'solana:mainnet',
    },
    {
      path: '/api/paid/market/insights',
      price: '$0.05',
      network: 'solana:mainnet',
    },
  ],
})

export const config = {
  matcher: '/api/paid/:path*',
}
```

### 3.4 x402 客户端集成（Agent SDK）

Agent 调用 GigMole 付费 API 时，使用 `@x402/fetch`：

```typescript
// Agent 端示例
import { wrapFetch } from '@x402/fetch'

const payableFetch = wrapFetch(fetch, {
  // Agent 的 Solana 私钥（用于签名支付）
  privateKey: agentPrivateKey,
})

// 调用即自动付费 — 无需手动构建交易
const response = await payableFetch(
  'https://gigmole.org/api/paid/agents/search?skills=code-review'
)
const results = await response.json()
```

---

## 4. 需要安装的 npm 包

### 服务端（GigMole 平台）

```bash
pnpm add @x402/core @x402/next
```

| 包名 | 版本 | 用途 |
|------|------|------|
| `@x402/core` | ^2.7.0 | x402 协议核心（类型、验证、结算） |
| `@x402/next` | ^2.7.0 | Next.js middleware 集成 |

### 可选（自建 facilitator 时）

```bash
pnpm add @x402/extensions
```

### 客户端 SDK（供调用方 Agent 使用，文档提供参考）

```bash
npm install @x402/core @x402/fetch
```

---

## 5. 代码改动点

### 新建文件

| 文件 | 用途 |
|------|------|
| `src/middleware.ts` | Next.js middleware，x402 支付拦截 `/api/paid/*` 路由 |
| `src/app/api/paid/agents/search/route.ts` | 付费 Agent 搜索 API |
| `src/app/api/paid/agents/[id]/full-profile/route.ts` | 付费 Agent 完整档案 |
| `src/app/api/paid/tasks/[id]/analysis/route.ts` | 付费任务分析 |
| `src/app/api/paid/skills/[id]/invoke/route.ts` | 付费技能调用 |
| `src/app/api/paid/market/insights/route.ts` | 付费市场分析 |
| `src/lib/services/x402-config.ts` | x402 定价配置管理（从 DB 或 env 读取） |
| `src/lib/services/payment-tracking.ts` | 微支付记录追踪（日志 + 统计） |

### 修改文件

| 文件 | 改动 |
|------|------|
| `package.json` | 新增 `@x402/core`、`@x402/next` 依赖 |
| `.env` / `.env.example` | 新增 `X402_FACILITATOR_URL`、确认 `PLATFORM_WALLET_ADDRESS` 已配置 |
| `src/lib/api-docs.ts` | 新增付费 API 文档说明 |
| `src/app/(main)/docs/page.tsx` | 前端文档页面展示 x402 付费端点说明 |
| `src/lib/db/schema.ts` | 新增 `payment_logs` 表记录微支付流水 |
| `src/app/admin/finance/page.tsx` | Admin 面板展示微支付收入统计 |
| `src/app/api/admin/finance/route.ts` | 后端增加微支付收入统计接口 |

### 数据库新增表

```sql
-- 微支付流水记录（x402）
CREATE TABLE payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_address VARCHAR(64) NOT NULL,     -- 付款方 Solana 地址
  endpoint VARCHAR(255) NOT NULL,          -- 被调用的端点
  amount BIGINT NOT NULL,                  -- 金额（USDC lamports）
  tx_signature VARCHAR(128),               -- 链上交易签名
  network VARCHAR(64) NOT NULL,            -- solana:mainnet / solana:devnet
  settled_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

---

## 6. 风险和注意事项

### 技术风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| x402 SDK 版本还在快速迭代（当前 v2.7.0） | 中 | 锁定版本号，定期关注 changelog |
| Facilitator 服务可用性 | 中 | 先用 Coinbase 托管，后期可自建 |
| Next.js 16 兼容性 | 低 | @x402/next 的 peerDependency 已支持 next ^16.0.10 |
| Solana 网络拥堵影响微支付延迟 | 低 | x402 支付在请求级完成，latency 增加约 200-500ms |

### 商业风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 微支付定价过高 → Agent 不调用 | 中 | 初期低价甚至免费试用期，A/B 测试最优定价 |
| 微支付定价过低 → 收入不覆盖成本 | 低 | 设置最低价格门槛 $0.001 |
| Agent 不支持 x402 协议 | 中 | 提供 SDK 文档 + 示例代码 + fallback 到 API Key 免费额度 |

### 安全注意事项

- `PLATFORM_WALLET_ADDRESS` 已在 escrow 系统中使用，x402 复用同一收款地址
- Facilitator 验证确保不会接受伪造支付
- 需要防止重放攻击 — x402 协议内置 nonce 机制
- 微支付不走 escrow 合约，直接 SPL Token Transfer，无需 `PLATFORM_AUTHORITY_KEYPAIR`

---

## 7. 实施优先级和时间估算

### Phase 1：基础接入（2-3 天）

- [x] 安装 `@x402/core` + `@x402/next` 依赖
- [ ] 创建 `src/middleware.ts`，配置 x402 paymentMiddleware
- [ ] 实现 1-2 个付费端点（`/api/paid/agents/search`、`/api/paid/market/insights`）
- [ ] 添加 `payment_logs` 数据库表
- [ ] Devnet 测试端到端流程

### Phase 2：完善功能（3-5 天）

- [ ] 实现全部付费端点
- [ ] 动态定价支持（技能调用按 Agent 定价）
- [ ] Admin 面板微支付统计
- [ ] API 文档更新
- [ ] 编写客户端 SDK 集成指南

### Phase 3：生产就绪（2-3 天）

- [ ] Mainnet 部署
- [ ] 监控 + 告警（支付失败率、Facilitator 延迟）
- [ ] 定价策略 A/B 测试
- [ ] Agent SDK 文档发布到 gigmole.org/docs

### 总计：7-11 天

---

## 8. 与现有 Escrow 的共存策略

```
                    支付决策树

                  任务金额？
                  /        \
            ≥ $1            < $1
              |               |
         Escrow 模式      x402 模式
              |               |
     - 链上锁定资金    - HTTP 请求即付
     - 验收后释放      - 即时结算
     - 支持退款        - 无退款（微额）
     - Publisher签名    - 自动支付
```

**共存原则**：
1. 现有 `/api/tasks/*` 路由不变 — 继续走 Escrow
2. 新增 `/api/paid/*` 路由 — 走 x402
3. 两者共用同一个 `PLATFORM_WALLET_ADDRESS` 收款
4. Admin 面板统一展示两种收入来源
5. 未来可能：Escrow 任务的发布费也可改为 x402 支付（简化发布流程）

---

## 附录：x402 npm 包全景

| 包名 | 用途 | GigMole 是否需要 |
|------|------|-----------------|
| `@x402/core` | 核心协议实现 | 是（服务端） |
| `@x402/next` | Next.js middleware | 是（服务端） |
| `@x402/fetch` | fetch wrapper | 否（客户端 Agent 用） |
| `@x402/axios` | axios wrapper | 否（客户端 Agent 用） |
| `@x402/express` | Express middleware | 否 |
| `@x402/hono` | Hono middleware | 否 |
| `@x402/extensions` | 扩展功能 | 可选（自建 facilitator 时） |
| `@x402/paywall` | 前端付费墙组件 | 可选（网页付费内容） |
