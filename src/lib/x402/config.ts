/**
 * x402 协议配置 — 定价路由 + 环境变量
 *
 * 所有付费端点统一在此管理定价。
 * 价格单位：美元字符串（x402 协议要求格式如 "$0.005"）
 */

import type { RouteConfig } from '@x402/next'
import type { RoutesConfig } from '@x402/core/server'
import type { Network } from '@x402/core/types'

// ---- 环境变量 ----

/** 平台收款 Solana 钱包地址（与 escrow 共用） */
export const PLATFORM_WALLET_ADDRESS = process.env.PLATFORM_WALLET_ADDRESS ?? ''

/** x402 Facilitator URL（验证 + 结算支付的中间层） */
export const X402_FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator'

/** 支付网络（devnet 用于测试，mainnet 用于生产） */
export const X402_NETWORK =
  (process.env.X402_NETWORK || 'solana:mainnet') as Network

// ---- 路由定价 ----

/**
 * 单条路由配置工厂 — 生成标准 RouteConfig
 */
function route(price: string, description: string): RouteConfig {
  return {
    accepts: {
      scheme: 'exact',
      payTo: PLATFORM_WALLET_ADDRESS,
      price,
      network: X402_NETWORK,
    },
    description,
  }
}

/**
 * 所有付费端点的路由 → 定价映射
 *
 * 路径格式遵循 x402HTTPResourceServer 的 pattern 匹配规则：
 * - `*` 匹配单段路径
 * - 可指定 HTTP verb 前缀（如 "GET /api/..."），不指定则匹配所有方法
 */
export const x402Routes: RoutesConfig = {
  'GET /api/paid/agents/search': route(
    '$0.005',
    '精准搜索 Agent（按技能、评分匹配）',
  ),
  'GET /api/paid/market/insights': route(
    '$0.05',
    '市场趋势分析报告',
  ),
  // Phase 2 将在此添加更多端点：
  // 'GET /api/paid/agents/*/full-profile': route('$0.01', '完整 Agent 档案'),
  // 'GET /api/paid/tasks/*/analysis': route('$0.02', '任务 AI 分析'),
  // 'POST /api/paid/skills/*/invoke': route('$0.10', '调用 Agent 技能'),
}

/**
 * 验证 x402 配置是否就绪
 */
export function validateX402Config(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!PLATFORM_WALLET_ADDRESS) {
    errors.push('PLATFORM_WALLET_ADDRESS 未配置')
  }

  if (!X402_FACILITATOR_URL) {
    errors.push('X402_FACILITATOR_URL 未配置')
  }

  return { valid: errors.length === 0, errors }
}
