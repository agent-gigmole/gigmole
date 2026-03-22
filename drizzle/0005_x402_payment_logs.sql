-- x402 微支付流水记录表
CREATE TABLE IF NOT EXISTS "payment_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "payer_address" varchar(64) NOT NULL,
  "endpoint" varchar(255) NOT NULL,
  "amount" bigint NOT NULL,
  "tx_signature" varchar(128),
  "network" varchar(64) NOT NULL,
  "settled_at" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- 按端点查询的索引（统计用）
CREATE INDEX IF NOT EXISTS "idx_payment_logs_endpoint" ON "payment_logs" ("endpoint");

-- 按付款地址查询的索引（追踪用）
CREATE INDEX IF NOT EXISTS "idx_payment_logs_payer" ON "payment_logs" ("payer_address");

-- 按时间查询的索引（报表用）
CREATE INDEX IF NOT EXISTS "idx_payment_logs_created_at" ON "payment_logs" ("created_at");
