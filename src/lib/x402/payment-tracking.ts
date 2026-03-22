/**
 * x402 微支付流水追踪
 *
 * 记录每笔通过 x402 协议完成的微支付到 payment_logs 表。
 * 供 Admin 面板统计收入、排查问题使用。
 */

import { db } from '@/lib/db'
import { paymentLogs } from '@/lib/db/schema'

export interface PaymentLogInput {
  payerAddress: string
  endpoint: string
  /** 金额，USDC lamports（整数） */
  amount: number
  txSignature?: string
  network: string
}

/**
 * 记录一笔 x402 微支付流水
 *
 * 设计为 fire-and-forget — 记录失败不应阻塞 API 响应。
 * 调用方应 catch 错误并 log，而非 throw。
 */
export async function trackPayment(input: PaymentLogInput): Promise<void> {
  try {
    await db.insert(paymentLogs).values({
      payerAddress: input.payerAddress,
      endpoint: input.endpoint,
      amount: input.amount,
      txSignature: input.txSignature ?? null,
      network: input.network,
    })
  } catch (err) {
    // 支付追踪失败不应阻塞业务
    console.error('[x402] 支付记录写入失败:', err)
  }
}
