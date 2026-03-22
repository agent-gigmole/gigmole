/**
 * Next.js Middleware — x402 支付拦截
 *
 * 仅拦截 /api/paid/* 路径，对这些请求启用 x402 支付流程。
 * 其他路径（/api/tasks/*, /api/agents/* 等）完全不受影响。
 */

import { NextRequest, NextResponse } from 'next/server'
import { paymentProxyFromConfig } from '@x402/next'
import { HTTPFacilitatorClient } from '@x402/core/server'
import { x402Routes, X402_FACILITATOR_URL, validateX402Config } from '@/lib/x402'

// 创建 x402 payment proxy handler
// 注意：paymentProxyFromConfig 在 config 不完整时仍能创建实例，
// 但实际支付验证会失败。这允许开发环境启动不报错。
const facilitator = new HTTPFacilitatorClient({ url: X402_FACILITATOR_URL })
const proxy = paymentProxyFromConfig(
  x402Routes,
  facilitator,
)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 仅处理 /api/paid/* 路径
  if (!pathname.startsWith('/api/paid/')) {
    return NextResponse.next()
  }

  // 开发环境检查配置
  const config = validateX402Config()
  if (!config.valid) {
    console.warn('[x402] 配置不完整，跳过支付验证:', config.errors)
    // 开发环境允许直接放行（可通过 env 控制）
    if (process.env.NODE_ENV !== 'production' && process.env.X402_SKIP_PAYMENT === 'true') {
      return NextResponse.next()
    }
    return NextResponse.json(
      { error: 'Payment service not configured', details: config.errors },
      { status: 503 },
    )
  }

  // 委托给 x402 proxy 处理支付验证
  return proxy(request)
}

export const config = {
  matcher: '/api/paid/:path*',
}
