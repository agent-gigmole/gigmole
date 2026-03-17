# Escrow Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect the deployed Solana escrow contract to platform API routes so USDC flows on-chain: lock on publish, release on accept, refund on reject/cancel.

**Architecture:** The Anchor contract acts as "on-chain Alipay" — it only handles money. Business logic stays centralized. Publisher signs once (to deposit). The platform server holds a `platform_authority` keypair to sign release/refund transactions. The contract must be modified to use `platform_authority` instead of `publisher` for release/refund, and `assign_worker` is removed entirely (centralized decision).

**Tech Stack:** Anchor (Rust), @solana/web3.js v1, @solana/spl-token, bs58, Next.js 16 API routes, Vitest, Drizzle ORM

---

## Phase 1: Contract Changes (Anchor/Rust)

### Task 1: Modify Anchor Contract

**Files:**
- Modify: `programs/escrow/src/lib.rs`

**Context:** The current contract has `worker: Pubkey` in Escrow struct, `assign_worker` instruction, and uses `publisher` as signer for release/refund. We need to:
1. Replace `worker` with `platform_authority` in Escrow struct
2. Add `platform_authority` account to CreateEscrow
3. Change release/refund signers from `publisher` to `platform_authority`
4. Remove `assign_worker` entirely
5. Remove `NoWorkerAssigned` error

**Step 1: Write the modified contract**

Replace the entire content of `programs/escrow/src/lib.rs` with:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh");

#[program]
pub mod escrow {
    use super::*;

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        task_id: String,
        amount: u64,
        listing_fee: u64,
        fee_bps: u16,
    ) -> Result<()> {
        require!(task_id.len() <= 64, EscrowError::TaskIdTooLong);
        require!(amount > listing_fee, EscrowError::InsufficientAmount);

        let escrow = &mut ctx.accounts.escrow;
        escrow.publisher = ctx.accounts.publisher.key();
        escrow.platform_authority = ctx.accounts.platform_authority.key();
        escrow.amount = amount - listing_fee;
        escrow.listing_fee = listing_fee;
        escrow.fee_bps = fee_bps;
        escrow.task_id = task_id;
        escrow.status = EscrowStatus::Funded;
        escrow.bump = ctx.bumps.escrow;

        // Transfer locked amount from publisher to vault
        let transfer_to_vault = Transfer {
            from: ctx.accounts.publisher_token.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.publisher.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_to_vault),
            amount - listing_fee,
        )?;

        // Transfer listing fee to platform
        if listing_fee > 0 {
            let transfer_fee = Transfer {
                from: ctx.accounts.publisher_token.to_account_info(),
                to: ctx.accounts.platform_token.to_account_info(),
                authority: ctx.accounts.publisher.to_account_info(),
            };
            token::transfer(
                CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_fee),
                listing_fee,
            )?;
        }

        Ok(())
    }

    pub fn release_escrow(ctx: Context<ReleaseEscrow>, _task_id: String) -> Result<()> {
        let escrow_status = ctx.accounts.escrow.status.clone();
        let escrow_amount = ctx.accounts.escrow.amount;
        let escrow_fee_bps = ctx.accounts.escrow.fee_bps;
        let escrow_task_id = ctx.accounts.escrow.task_id.clone();
        let escrow_bump = ctx.accounts.escrow.bump;

        require!(escrow_status == EscrowStatus::Funded, EscrowError::InvalidStatus);

        let fee = escrow_amount.checked_mul(escrow_fee_bps as u64).unwrap() / 10000;
        let payout = escrow_amount - fee;

        let task_id_bytes = escrow_task_id.as_bytes().to_vec();
        let seeds = &[b"escrow".as_ref(), task_id_bytes.as_slice(), &[escrow_bump]];
        let signer_seeds = &[&seeds[..]];

        // Transfer payout to worker
        let transfer_payout = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.worker_token.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_payout,
                signer_seeds,
            ),
            payout,
        )?;

        // Transfer service fee to platform
        if fee > 0 {
            let transfer_fee = Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.platform_token.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    transfer_fee,
                    signer_seeds,
                ),
                fee,
            )?;
        }

        ctx.accounts.escrow.status = EscrowStatus::Released;
        Ok(())
    }

    pub fn refund_escrow(ctx: Context<RefundEscrow>, _task_id: String) -> Result<()> {
        let escrow_status = ctx.accounts.escrow.status.clone();
        let escrow_amount = ctx.accounts.escrow.amount;
        let escrow_task_id = ctx.accounts.escrow.task_id.clone();
        let escrow_bump = ctx.accounts.escrow.bump;

        require!(escrow_status == EscrowStatus::Funded, EscrowError::InvalidStatus);

        let task_id_bytes = escrow_task_id.as_bytes().to_vec();
        let seeds = &[b"escrow".as_ref(), task_id_bytes.as_slice(), &[escrow_bump]];
        let signer_seeds = &[&seeds[..]];

        let transfer_refund = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.publisher_token.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_refund,
                signer_seeds,
            ),
            escrow_amount,
        )?;

        ctx.accounts.escrow.status = EscrowStatus::Refunded;
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowStatus {
    Funded,
    Released,
    Refunded,
}

#[account]
pub struct Escrow {
    pub publisher: Pubkey,           // 32 bytes — funds source
    pub platform_authority: Pubkey,  // 32 bytes — signs release/refund
    pub amount: u64,                 // 8 bytes — locked amount (excluding listing fee)
    pub listing_fee: u64,            // 8 bytes — non-refundable listing fee already paid
    pub fee_bps: u16,                // 2 bytes — service fee basis points
    pub task_id: String,             // 4+64 bytes
    pub status: EscrowStatus,        // 1 byte
    pub bump: u8,                    // 1 byte
}

impl Escrow {
    // 32 + 32 + 8 + 8 + 2 + (4 + 64) + 1 + 1 = 152
    pub const MAX_SIZE: usize = 32 + 32 + 8 + 8 + 2 + (4 + 64) + 1 + 1;
}

#[derive(Accounts)]
#[instruction(task_id: String, amount: u64, listing_fee: u64, fee_bps: u16)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = publisher,
        space = 8 + Escrow::MAX_SIZE,
        seeds = [b"escrow", task_id.as_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub publisher: Signer<'info>,
    /// CHECK: Platform authority pubkey, stored for later release/refund authorization
    pub platform_authority: AccountInfo<'info>,
    #[account(mut)]
    pub publisher_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub platform_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(_task_id: String)]
pub struct ReleaseEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", _task_id.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        constraint = platform_authority.key() == escrow.platform_authority @ EscrowError::Unauthorized
    )]
    pub platform_authority: Signer<'info>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub worker_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub platform_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(_task_id: String)]
pub struct RefundEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", _task_id.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        constraint = platform_authority.key() == escrow.platform_authority @ EscrowError::Unauthorized
    )]
    pub platform_authority: Signer<'info>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub publisher_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum EscrowError {
    #[msg("Invalid escrow status for this operation")]
    InvalidStatus,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Task ID too long (max 64 chars)")]
    TaskIdTooLong,
    #[msg("Amount must be greater than listing fee")]
    InsufficientAmount,
}
```

Key changes from current contract:
- `worker: Pubkey` → `platform_authority: Pubkey` in Escrow struct
- `CreateEscrow` gains `platform_authority: AccountInfo` (CHECK account)
- `ReleaseEscrow.publisher: Signer` → `platform_authority: Signer` with constraint check
- `RefundEscrow.publisher: Signer` → `platform_authority: Signer` with constraint check
- `release_escrow` fn: removed `escrow_publisher`, `escrow_worker` variables and `NoWorkerAssigned` check
- `refund_escrow` fn: removed `escrow_publisher` variable and publisher check
- Deleted `assign_worker` fn + `AssignWorker` struct entirely
- Deleted `NoWorkerAssigned` error variant

**Step 2: Verify it compiles**

Run: `cd /home/qmt/project/aglabor && anchor build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add programs/escrow/src/lib.rs
git commit -m "feat(escrow): replace worker with platform_authority, remove assign_worker"
```

---

### Task 2: Deploy to Devnet + Update IDL

**Files:**
- Deploy: `programs/escrow/` (on-chain)
- Create: `src/lib/solana/idl/escrow.json` (copy from build output)

**Step 1: Deploy to devnet**

Run: `cd /home/qmt/project/aglabor && anchor deploy --provider.cluster devnet`
Expected: Deploy succeeds, program ID remains `F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh`

**Step 2: Copy IDL to app source**

Run:
```bash
mkdir -p src/lib/solana/idl
cp target/idl/escrow.json src/lib/solana/idl/escrow.json
```

**Step 3: Verify IDL reflects changes**

Read `src/lib/solana/idl/escrow.json` and verify:
- No `assign_worker` instruction
- `create_escrow` accounts include `platform_authority`
- `release_escrow` and `refund_escrow` accounts have `platform_authority` (signer) instead of `publisher`
- Escrow type has `platform_authority` field instead of `worker`

**Step 4: Commit**

```bash
git add src/lib/solana/idl/escrow.json target/idl/escrow.json
git commit -m "feat(escrow): deploy v2 to devnet, update IDL"
```

---

## Phase 2: Server Solana Utilities (TypeScript, TDD)

### Task 3: Platform Authority Keypair Loader

**Files:**
- Create: `src/lib/solana/platform-authority.ts`
- Create: `tests/lib/solana/platform-authority.test.ts`

**Step 1: Write the failing tests**

```typescript
// tests/lib/solana/platform-authority.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Platform Authority', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...ORIGINAL_ENV }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('loads keypair from PLATFORM_AUTHORITY_KEYPAIR env var', async () => {
    // Generate a known keypair for testing
    const { Keypair } = await import('@solana/web3.js')
    const testKeypair = Keypair.generate()
    const bs58 = await import('bs58')
    process.env.PLATFORM_AUTHORITY_KEYPAIR = bs58.default.encode(testKeypair.secretKey)

    const { getPlatformAuthority } = await import('@/lib/solana/platform-authority')
    const loaded = getPlatformAuthority()

    expect(loaded.publicKey.toBase58()).toBe(testKeypair.publicKey.toBase58())
  })

  it('throws if PLATFORM_AUTHORITY_KEYPAIR is not set', async () => {
    delete process.env.PLATFORM_AUTHORITY_KEYPAIR

    const { getPlatformAuthority } = await import('@/lib/solana/platform-authority')
    expect(() => getPlatformAuthority()).toThrow('PLATFORM_AUTHORITY_KEYPAIR')
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/lib/solana/platform-authority.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/lib/solana/platform-authority.ts
import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'

export function getPlatformAuthority(): Keypair {
  const encoded = process.env.PLATFORM_AUTHORITY_KEYPAIR
  if (!encoded) {
    throw new Error(
      'PLATFORM_AUTHORITY_KEYPAIR environment variable is required. ' +
      'Set it to the base58-encoded secret key of the platform authority.'
    )
  }
  const secretKey = bs58.decode(encoded)
  return Keypair.fromSecretKey(secretKey)
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/lib/solana/platform-authority.test.ts`
Expected: 2/2 PASS

**Step 5: Commit**

```bash
git add src/lib/solana/platform-authority.ts tests/lib/solana/platform-authority.test.ts
git commit -m "feat(solana): add platform authority keypair loader"
```

---

### Task 4: Escrow Account Deserialization

**Files:**
- Modify: `src/lib/solana/escrow.ts`
- Modify: `tests/lib/solana/escrow.test.ts`

**Context:** The current `getEscrowAccount()` returns raw `AccountInfo`. We need a `parseEscrowAccount()` that deserializes the Borsh-encoded Escrow struct into a typed object.

Escrow account binary layout (after 8-byte Anchor discriminator):
| Field | Type | Bytes |
|-------|------|-------|
| publisher | Pubkey | 32 |
| platform_authority | Pubkey | 32 |
| amount | u64 LE | 8 |
| listing_fee | u64 LE | 8 |
| fee_bps | u16 LE | 2 |
| task_id | Borsh string (4 byte len + utf8) | 4+N |
| status | u8 enum (0=Funded,1=Released,2=Refunded) | 1 |
| bump | u8 | 1 |

**Step 1: Write the failing tests**

Add to `tests/lib/solana/escrow.test.ts`:

```typescript
// Add these imports at the top
import { describe, it, expect, vi } from 'vitest'
import { getEscrowPDA, parseEscrowAccount, EscrowData } from '@/lib/solana/escrow'
import { PublicKey } from '@solana/web3.js'

// Mock the connection so we don't hit devnet
vi.mock('@/lib/solana/client', () => ({
  connection: {
    getAccountInfo: vi.fn(),
  },
}))

// Keep existing PDA tests...

describe('parseEscrowAccount', () => {
  it('parses a funded escrow account correctly', async () => {
    const { connection } = await import('@/lib/solana/client')
    const publisher = PublicKey.unique()
    const platformAuth = PublicKey.unique()
    const taskId = 'test-task-123'

    // Build mock account data matching Borsh layout
    const discriminator = Buffer.alloc(8) // don't care about value in test
    const pubBytes = publisher.toBuffer()
    const platBytes = platformAuth.toBuffer()
    const amount = Buffer.alloc(8)
    amount.writeBigUInt64LE(5000000n)
    const listingFee = Buffer.alloc(8)
    listingFee.writeBigUInt64LE(2000000n)
    const feeBps = Buffer.alloc(2)
    feeBps.writeUInt16LE(500)
    const taskIdBytes = Buffer.from(taskId, 'utf-8')
    const taskIdLen = Buffer.alloc(4)
    taskIdLen.writeUInt32LE(taskIdBytes.length)
    const status = Buffer.from([0]) // Funded
    const bump = Buffer.from([255])

    const data = Buffer.concat([
      discriminator, pubBytes, platBytes, amount, listingFee,
      feeBps, taskIdLen, taskIdBytes, status, bump,
    ])

    vi.mocked(connection.getAccountInfo).mockResolvedValue({
      data,
      executable: false,
      lamports: 1000000,
      owner: new PublicKey('F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh'),
    } as any)

    const result = await parseEscrowAccount(taskId)

    expect(result).not.toBeNull()
    expect(result!.publisher).toBe(publisher.toBase58())
    expect(result!.platformAuthority).toBe(platformAuth.toBase58())
    expect(result!.amount).toBe(5000000)
    expect(result!.listingFee).toBe(2000000)
    expect(result!.feeBps).toBe(500)
    expect(result!.taskId).toBe(taskId)
    expect(result!.status).toBe('Funded')
    expect(result!.bump).toBe(255)
  })

  it('returns null for non-existent account', async () => {
    const { connection } = await import('@/lib/solana/client')
    vi.mocked(connection.getAccountInfo).mockResolvedValue(null)

    const result = await parseEscrowAccount('nonexistent-task')
    expect(result).toBeNull()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/lib/solana/escrow.test.ts`
Expected: FAIL — `parseEscrowAccount` not exported

**Step 3: Write minimal implementation**

Replace `src/lib/solana/escrow.ts` with:

```typescript
import { PublicKey } from '@solana/web3.js'
import { connection } from './client'

const PROGRAM_ID = new PublicKey(
  process.env.SOLANA_ESCROW_PROGRAM_ID || '11111111111111111111111111111111'
)

export interface EscrowData {
  publisher: string
  platformAuthority: string
  amount: number
  listingFee: number
  feeBps: number
  taskId: string
  status: 'Funded' | 'Released' | 'Refunded'
  bump: number
}

const STATUS_MAP: Record<number, EscrowData['status']> = {
  0: 'Funded',
  1: 'Released',
  2: 'Refunded',
}

export function getEscrowPDA(taskId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), Buffer.from(taskId)],
    PROGRAM_ID
  )
}

export async function getEscrowAccount(taskId: string) {
  const [pda] = getEscrowPDA(taskId)
  const accountInfo = await connection.getAccountInfo(pda)
  return accountInfo
}

export async function parseEscrowAccount(taskId: string): Promise<EscrowData | null> {
  const accountInfo = await getEscrowAccount(taskId)
  if (!accountInfo) return null

  const data = Buffer.from(accountInfo.data)
  let offset = 8 // skip Anchor discriminator

  const publisher = new PublicKey(data.subarray(offset, offset + 32)).toBase58()
  offset += 32

  const platformAuthority = new PublicKey(data.subarray(offset, offset + 32)).toBase58()
  offset += 32

  const amount = Number(data.readBigUInt64LE(offset))
  offset += 8

  const listingFee = Number(data.readBigUInt64LE(offset))
  offset += 8

  const feeBps = data.readUInt16LE(offset)
  offset += 2

  const taskIdLen = data.readUInt32LE(offset)
  offset += 4
  const taskIdStr = data.subarray(offset, offset + taskIdLen).toString('utf-8')
  offset += taskIdLen

  const statusByte = data[offset]
  offset += 1

  const bump = data[offset]

  return {
    publisher,
    platformAuthority,
    amount,
    listingFee,
    feeBps,
    taskId: taskIdStr,
    status: STATUS_MAP[statusByte] ?? 'Funded',
    bump,
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/lib/solana/escrow.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/lib/solana/escrow.ts tests/lib/solana/escrow.test.ts
git commit -m "feat(solana): add escrow account deserialization"
```

---

### Task 5: Release Escrow Instruction Builder

**Files:**
- Create: `src/lib/solana/instructions.ts`
- Create: `tests/lib/solana/instructions.test.ts`

**Context:** Server needs to build, sign, and send `release_escrow` transactions using the `platform_authority` keypair. We construct TransactionInstruction manually using the IDL discriminator, avoiding the heavy `@coral-xyz/anchor` dependency.

The `release_escrow` instruction discriminator from the IDL (check `src/lib/solana/idl/escrow.json` after Task 2). Use the discriminator bytes from the new IDL. If unchanged: `[146, 253, 129, 233, 20, 145, 181, 206]`.

Accounts for release_escrow (new contract):
1. `escrow` (writable, PDA)
2. `platform_authority` (signer)
3. `vault` (writable)
4. `worker_token` (writable)
5. `platform_token` (writable)
6. `token_program`

**Step 1: Write the failing tests**

```typescript
// tests/lib/solana/instructions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PublicKey, Keypair, Transaction } from '@solana/web3.js'

vi.mock('@/lib/solana/client', () => ({
  connection: {
    getLatestBlockhash: vi.fn().mockResolvedValue({
      blockhash: 'FakeBlockhash111111111111111111111111111111111',
      lastValidBlockHeight: 100,
    }),
    sendRawTransaction: vi.fn().mockResolvedValue('fakeTxSig123'),
    confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
  },
}))

vi.mock('@/lib/solana/platform-authority', () => {
  const testKeypair = Keypair.generate()
  return {
    getPlatformAuthority: vi.fn().mockReturnValue(testKeypair),
    _testKeypair: testKeypair,
  }
})

vi.mock('@/lib/solana/escrow', () => ({
  getEscrowPDA: vi.fn().mockReturnValue([PublicKey.unique(), 255]),
}))

import { buildReleaseInstruction } from '@/lib/solana/instructions'

describe('buildReleaseInstruction', () => {
  it('builds a release instruction with correct accounts', () => {
    const escrowPda = PublicKey.unique()
    const platformAuth = Keypair.generate().publicKey
    const vault = PublicKey.unique()
    const workerToken = PublicKey.unique()
    const platformToken = PublicKey.unique()

    const ix = buildReleaseInstruction({
      taskId: 'task-123',
      escrowPda,
      platformAuthority: platformAuth,
      vault,
      workerToken,
      platformToken,
    })

    expect(ix.keys).toHaveLength(6)
    expect(ix.keys[0].pubkey.equals(escrowPda)).toBe(true)
    expect(ix.keys[0].isWritable).toBe(true)
    expect(ix.keys[1].pubkey.equals(platformAuth)).toBe(true)
    expect(ix.keys[1].isSigner).toBe(true)
    expect(ix.keys[2].pubkey.equals(vault)).toBe(true)
    expect(ix.keys[3].pubkey.equals(workerToken)).toBe(true)
    expect(ix.keys[4].pubkey.equals(platformToken)).toBe(true)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/lib/solana/instructions.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/lib/solana/instructions.ts
import {
  PublicKey,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { connection } from './client'
import { getPlatformAuthority } from './platform-authority'
import { getEscrowPDA } from './escrow'

const PROGRAM_ID = new PublicKey(
  process.env.SOLANA_ESCROW_PROGRAM_ID || '11111111111111111111111111111111'
)

// Read discriminators from IDL after Task 2 build.
// These are sha256("global:<name>")[..8] — stable across account changes.
// Verify against src/lib/solana/idl/escrow.json after deploy.
const RELEASE_DISCRIMINATOR = Buffer.from([146, 253, 129, 233, 20, 145, 181, 206])
const REFUND_DISCRIMINATOR = Buffer.from([107, 186, 89, 99, 26, 194, 23, 204])

function serializeBorshString(s: string): Buffer {
  const bytes = Buffer.from(s, 'utf-8')
  const len = Buffer.alloc(4)
  len.writeUInt32LE(bytes.length, 0)
  return Buffer.concat([len, bytes])
}

interface ReleaseParams {
  taskId: string
  escrowPda: PublicKey
  platformAuthority: PublicKey
  vault: PublicKey
  workerToken: PublicKey
  platformToken: PublicKey
}

export function buildReleaseInstruction(params: ReleaseParams): TransactionInstruction {
  const data = Buffer.concat([
    RELEASE_DISCRIMINATOR,
    serializeBorshString(params.taskId),
  ])

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: params.escrowPda, isSigner: false, isWritable: true },
      { pubkey: params.platformAuthority, isSigner: true, isWritable: false },
      { pubkey: params.vault, isSigner: false, isWritable: true },
      { pubkey: params.workerToken, isSigner: false, isWritable: true },
      { pubkey: params.platformToken, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  })
}

interface RefundParams {
  taskId: string
  escrowPda: PublicKey
  platformAuthority: PublicKey
  vault: PublicKey
  publisherToken: PublicKey
}

export function buildRefundInstruction(params: RefundParams): TransactionInstruction {
  const data = Buffer.concat([
    REFUND_DISCRIMINATOR,
    serializeBorshString(params.taskId),
  ])

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: params.escrowPda, isSigner: false, isWritable: true },
      { pubkey: params.platformAuthority, isSigner: true, isWritable: false },
      { pubkey: params.vault, isSigner: false, isWritable: true },
      { pubkey: params.publisherToken, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  })
}

export async function sendReleaseEscrow(
  taskId: string,
  workerWallet: PublicKey,
): Promise<string> {
  const authority = getPlatformAuthority()
  const [escrowPda] = getEscrowPDA(taskId)
  const { getAssociatedTokenAddressSync } = await import('@solana/spl-token')
  const usdcMint = new PublicKey(process.env.USDC_MINT_ADDRESS!)

  const vault = getAssociatedTokenAddressSync(usdcMint, escrowPda, true)
  const workerToken = getAssociatedTokenAddressSync(usdcMint, workerWallet)
  const platformWallet = new PublicKey(process.env.PLATFORM_WALLET_ADDRESS!)
  const platformToken = getAssociatedTokenAddressSync(usdcMint, platformWallet)

  const ix = buildReleaseInstruction({
    taskId,
    escrowPda,
    platformAuthority: authority.publicKey,
    vault,
    workerToken,
    platformToken,
  })

  const tx = new Transaction().add(ix)
  const sig = await sendAndConfirmTransaction(connection, tx, [authority])
  return sig
}

export async function sendRefundEscrow(
  taskId: string,
  publisherWallet: PublicKey,
): Promise<string> {
  const authority = getPlatformAuthority()
  const [escrowPda] = getEscrowPDA(taskId)
  const { getAssociatedTokenAddressSync } = await import('@solana/spl-token')
  const usdcMint = new PublicKey(process.env.USDC_MINT_ADDRESS!)

  const vault = getAssociatedTokenAddressSync(usdcMint, escrowPda, true)
  const publisherToken = getAssociatedTokenAddressSync(usdcMint, publisherWallet)

  const ix = buildRefundInstruction({
    taskId,
    escrowPda,
    platformAuthority: authority.publicKey,
    vault,
    publisherToken,
  })

  const tx = new Transaction().add(ix)
  const sig = await sendAndConfirmTransaction(connection, tx, [authority])
  return sig
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/lib/solana/instructions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/solana/instructions.ts tests/lib/solana/instructions.test.ts
git commit -m "feat(solana): add release and refund instruction builders"
```

---

### Task 6: Refund Instruction Test

**Files:**
- Modify: `tests/lib/solana/instructions.test.ts`

**Step 1: Add refund instruction test**

Append to `tests/lib/solana/instructions.test.ts`:

```typescript
import { buildRefundInstruction } from '@/lib/solana/instructions'

describe('buildRefundInstruction', () => {
  it('builds a refund instruction with correct accounts', () => {
    const escrowPda = PublicKey.unique()
    const platformAuth = Keypair.generate().publicKey
    const vault = PublicKey.unique()
    const publisherToken = PublicKey.unique()

    const ix = buildRefundInstruction({
      taskId: 'task-456',
      escrowPda,
      platformAuthority: platformAuth,
      vault,
      publisherToken,
    })

    expect(ix.keys).toHaveLength(5)
    expect(ix.keys[0].pubkey.equals(escrowPda)).toBe(true)
    expect(ix.keys[0].isWritable).toBe(true)
    expect(ix.keys[1].pubkey.equals(platformAuth)).toBe(true)
    expect(ix.keys[1].isSigner).toBe(true)
    expect(ix.keys[2].pubkey.equals(vault)).toBe(true)
    expect(ix.keys[3].pubkey.equals(publisherToken)).toBe(true)
  })

  it('serializes task_id in instruction data', () => {
    const ix = buildRefundInstruction({
      taskId: 'my-task',
      escrowPda: PublicKey.unique(),
      platformAuthority: Keypair.generate().publicKey,
      vault: PublicKey.unique(),
      publisherToken: PublicKey.unique(),
    })

    // 8 bytes discriminator + 4 bytes string length + 7 bytes "my-task"
    expect(ix.data.length).toBe(8 + 4 + 7)
  })
})
```

**Step 2: Run tests to verify they pass**

Run: `pnpm vitest run tests/lib/solana/instructions.test.ts`
Expected: All PASS

**Step 3: Commit**

```bash
git add tests/lib/solana/instructions.test.ts
git commit -m "test(solana): add refund instruction builder tests"
```

---

## Phase 3: API Routes (TypeScript, TDD)

### Task 7: GET /api/escrow/prepare Endpoint

**Files:**
- Create: `src/app/api/escrow/prepare/route.ts`
- Create: `tests/api/escrow/prepare.test.ts`

**Context:** This endpoint returns all parameters an Agent needs to build a `create_escrow` transaction locally. The Agent calls this, builds the tx, signs with their wallet, sends to Solana, then posts the task. Requires auth (Bearer token).

**Step 1: Write the failing tests**

```typescript
// tests/api/escrow/prepare.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PublicKey } from '@solana/web3.js'

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'agent-uuid',
    name: 'TestAgent',
    walletAddress: 'SoLWaLLet123',
  }),
}))

vi.mock('@/lib/solana/escrow', () => ({
  getEscrowPDA: vi.fn().mockReturnValue([
    new PublicKey('11111111111111111111111111111112'),
    254,
  ]),
}))

vi.mock('@solana/spl-token', () => ({
  getAssociatedTokenAddressSync: vi.fn().mockReturnValue(
    new PublicKey('11111111111111111111111111111113')
  ),
}))

// Set env vars before importing the route
process.env.SOLANA_ESCROW_PROGRAM_ID = 'F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh'
process.env.USDC_MINT_ADDRESS = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
process.env.PLATFORM_WALLET_ADDRESS = 'D1yNArYHmypsKNph46i2Zpa9m7sHYtdXzkxYrP1vswfQ'
process.env.PLATFORM_AUTHORITY_KEYPAIR = '' // not needed for prepare, just the pubkey
process.env.LISTING_FEE_LAMPORTS = '2000000'
process.env.TRANSACTION_FEE_BPS = '500'

import { GET } from '@/app/api/escrow/prepare/route'
import { authenticateRequest } from '@/lib/auth/middleware'
import { NextResponse } from 'next/server'

function makeRequest(url: string) {
  return new Request(url, {
    method: 'GET',
    headers: { Authorization: 'Bearer agl_test' },
  }) as unknown as import('next/server').NextRequest
}

describe('GET /api/escrow/prepare', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns escrow params for valid task_id', async () => {
    const request = makeRequest(
      'http://localhost/api/escrow/prepare?task_id=test-task-uuid'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.escrow_pda).toBeDefined()
    expect(data.escrow_bump).toBeDefined()
    expect(data.vault_address).toBeDefined()
    expect(data.usdc_mint).toBe('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
    expect(data.platform_wallet).toBe('D1yNArYHmypsKNph46i2Zpa9m7sHYtdXzkxYrP1vswfQ')
    expect(data.program_id).toBe('F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh')
    expect(data.listing_fee).toBe(2000000)
    expect(data.fee_bps).toBe(500)
  })

  it('returns 400 if task_id is missing', async () => {
    const request = makeRequest('http://localhost/api/escrow/prepare')

    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('returns 401 if not authenticated', async () => {
    vi.mocked(authenticateRequest).mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )

    const request = makeRequest(
      'http://localhost/api/escrow/prepare?task_id=test'
    )

    const response = await GET(request)
    expect(response.status).toBe(401)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/api/escrow/prepare.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/app/api/escrow/prepare/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { getEscrowPDA } from '@/lib/solana/escrow'
import { PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('task_id')

  if (!taskId) {
    return NextResponse.json(
      { error: 'task_id query parameter is required' },
      { status: 400 }
    )
  }

  const [escrowPda, bump] = getEscrowPDA(taskId)
  const usdcMint = new PublicKey(process.env.USDC_MINT_ADDRESS!)
  const platformWallet = new PublicKey(process.env.PLATFORM_WALLET_ADDRESS!)

  const vault = getAssociatedTokenAddressSync(usdcMint, escrowPda, true)
  const platformToken = getAssociatedTokenAddressSync(usdcMint, platformWallet)

  return NextResponse.json({
    escrow_pda: escrowPda.toBase58(),
    escrow_bump: bump,
    vault_address: vault.toBase58(),
    platform_token: platformToken.toBase58(),
    usdc_mint: usdcMint.toBase58(),
    platform_wallet: platformWallet.toBase58(),
    platform_authority: process.env.PLATFORM_AUTHORITY_PUBKEY || '',
    program_id: process.env.SOLANA_ESCROW_PROGRAM_ID!,
    listing_fee: Number(process.env.LISTING_FEE_LAMPORTS || '2000000'),
    fee_bps: Number(process.env.TRANSACTION_FEE_BPS || '500'),
  })
}
```

**Note:** `PLATFORM_AUTHORITY_PUBKEY` is the public key counterpart of `PLATFORM_AUTHORITY_KEYPAIR`. We derive it at startup or set it as a separate env var. For simplicity, set it in `.env`. The implementer should load it from the keypair if not set — see note in Task 13.

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/api/escrow/prepare.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/escrow/prepare/route.ts tests/api/escrow/prepare.test.ts
git commit -m "feat(api): add GET /api/escrow/prepare endpoint"
```

---

### Task 8: POST /api/tasks — Escrow Verification

**Files:**
- Modify: `src/app/api/tasks/route.ts`
- Modify: `tests/api/tasks/crud.test.ts`

**Context:** When `escrow_tx` is provided in the POST body, the server must:
1. Look up the agent's wallet address
2. Verify the escrow PDA exists on-chain for the given `task_id`
3. Verify: `escrow.status == 'Funded'`, `escrow.publisher == agent.walletAddress`, `escrow.amount + escrow.listingFee == budget`
4. Store `escrowAddress` and `escrowTx` in the task row

The `task_id` is pre-generated by the Agent (sent as `id` in the request body). The DB insert must use this specific UUID.

When `escrow_tx` is NOT provided, task creation works as before (backward compat, for testing/development).

**Step 1: Write the failing tests**

Add to `tests/api/tasks/crud.test.ts` (or create a separate `tests/api/tasks/escrow-create.test.ts`):

```typescript
// tests/api/tasks/escrow-create.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

const mockReturning = vi.fn()
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

vi.mock('@/lib/db', () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            offset: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
  },
}))

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'agent-uuid',
    name: 'TestAgent',
    walletAddress: 'PublisherWalletAddr',
  }),
}))

vi.mock('@/lib/solana/escrow', () => ({
  parseEscrowAccount: vi.fn(),
  getEscrowPDA: vi.fn().mockReturnValue([{ toBase58: () => 'EscrowPdaAddr' }, 255]),
}))

import { POST } from '@/app/api/tasks/route'
import { parseEscrowAccount } from '@/lib/solana/escrow'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer agl_test',
    },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

describe('POST /api/tasks with escrow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReturning.mockResolvedValue([{
      id: 'task-uuid',
      title: 'Test Task',
      budget: 7000000,
      status: 'open',
      escrowAddress: 'EscrowPdaAddr',
      escrowTx: 'txSig123',
    }])
  })

  it('creates task with escrow verification when escrow_tx provided', async () => {
    vi.mocked(parseEscrowAccount).mockResolvedValue({
      publisher: 'PublisherWalletAddr',
      platformAuthority: 'PlatformAuthPubkey',
      amount: 5000000,
      listingFee: 2000000,
      feeBps: 500,
      taskId: 'task-uuid',
      status: 'Funded',
      bump: 255,
    })

    const request = makeRequest({
      id: 'task-uuid',
      title: 'Test Task',
      description: 'A test task',
      budget: 7000000,
      escrow_tx: 'txSig123',
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('rejects if escrow not found on-chain', async () => {
    vi.mocked(parseEscrowAccount).mockResolvedValue(null)

    const request = makeRequest({
      id: 'task-uuid',
      title: 'Test Task',
      description: 'A test task',
      budget: 7000000,
      escrow_tx: 'txSig123',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('escrow')
  })

  it('rejects if escrow amount does not match budget', async () => {
    vi.mocked(parseEscrowAccount).mockResolvedValue({
      publisher: 'PublisherWalletAddr',
      platformAuthority: 'PlatformAuthPubkey',
      amount: 1000000,
      listingFee: 2000000,
      feeBps: 500,
      taskId: 'task-uuid',
      status: 'Funded',
      bump: 255,
    })

    const request = makeRequest({
      id: 'task-uuid',
      title: 'Test Task',
      description: 'A test task',
      budget: 7000000,
      escrow_tx: 'txSig123',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('mismatch')
  })

  it('rejects if escrow publisher does not match agent wallet', async () => {
    vi.mocked(parseEscrowAccount).mockResolvedValue({
      publisher: 'SomeOtherWallet',
      platformAuthority: 'PlatformAuthPubkey',
      amount: 5000000,
      listingFee: 2000000,
      feeBps: 500,
      taskId: 'task-uuid',
      status: 'Funded',
      bump: 255,
    })

    const request = makeRequest({
      id: 'task-uuid',
      title: 'Test Task',
      description: 'A test task',
      budget: 7000000,
      escrow_tx: 'txSig123',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('publisher')
  })

  it('still creates task without escrow_tx (backward compat)', async () => {
    const request = makeRequest({
      title: 'Simple Task',
      description: 'No escrow needed',
      budget: 5000000,
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/api/tasks/escrow-create.test.ts`
Expected: FAIL — escrow verification not implemented

**Step 3: Write the implementation**

Update `src/app/api/tasks/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { tasks, TaskStatus } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { parseEscrowAccount, getEscrowPDA } from '@/lib/solana/escrow'

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => ({}))

  if (!body.title || typeof body.title !== 'string') {
    return NextResponse.json(
      { error: 'title is required' },
      { status: 400 }
    )
  }

  if (!body.description || typeof body.description !== 'string') {
    return NextResponse.json(
      { error: 'description is required' },
      { status: 400 }
    )
  }

  if (body.budget === undefined || typeof body.budget !== 'number') {
    return NextResponse.json(
      { error: 'budget is required and must be a number' },
      { status: 400 }
    )
  }

  let escrowAddress: string | undefined
  let escrowTx: string | undefined

  // If escrow_tx provided, verify on-chain escrow
  if (body.escrow_tx) {
    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json(
        { error: 'id (task UUID) is required when escrow_tx is provided' },
        { status: 400 }
      )
    }

    const escrow = await parseEscrowAccount(body.id)
    if (!escrow) {
      return NextResponse.json(
        { error: 'Escrow account not found on-chain for this task_id' },
        { status: 400 }
      )
    }

    if (escrow.status !== 'Funded') {
      return NextResponse.json(
        { error: `Escrow status is "${escrow.status}", expected "Funded"` },
        { status: 400 }
      )
    }

    if (escrow.amount + escrow.listingFee !== body.budget) {
      return NextResponse.json(
        { error: `Budget mismatch: on-chain ${escrow.amount + escrow.listingFee}, request ${body.budget}` },
        { status: 400 }
      )
    }

    if (escrow.publisher !== auth.walletAddress) {
      return NextResponse.json(
        { error: 'Escrow publisher does not match your wallet address' },
        { status: 400 }
      )
    }

    const [pda] = getEscrowPDA(body.id)
    escrowAddress = pda.toBase58()
    escrowTx = body.escrow_tx
  }

  const insertValues: Record<string, unknown> = {
    publisherId: auth.id,
    title: body.title.trim(),
    description: body.description.trim(),
    budget: body.budget,
    deadline: body.deadline ? new Date(body.deadline) : undefined,
    deliverableSpec: body.deliverableSpec || '',
    tags: body.tags || [],
  }

  // Use provided UUID if escrow flow
  if (body.id && body.escrow_tx) {
    insertValues.id = body.id
  }

  if (escrowAddress) {
    insertValues.escrowAddress = escrowAddress
    insertValues.escrowTx = escrowTx
  }

  const [task] = await db
    .insert(tasks)
    .values(insertValues as any)
    .returning()

  return NextResponse.json(task, { status: 201 })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const offset = (page - 1) * limit

  const results = await db
    .select()
    .from(tasks)
    .orderBy(desc(tasks.createdAt))
    .limit(limit)
    .offset(offset)

  return NextResponse.json(results)
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/api/tasks/escrow-create.test.ts`
Expected: All PASS

**Step 5: Also run existing crud tests to ensure backward compat**

Run: `pnpm vitest run tests/api/tasks/crud.test.ts`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/app/api/tasks/route.ts tests/api/tasks/escrow-create.test.ts
git commit -m "feat(api): verify on-chain escrow when creating tasks"
```

---

### Task 9: Accept Route — Release Escrow

**Files:**
- Modify: `src/app/api/tasks/[id]/accept/route.ts`
- Modify: `tests/api/tasks/execution.test.ts`

**Context:** When a task with `escrowAddress` is accepted, the server calls `sendReleaseEscrow` to transfer USDC from vault to worker. The worker's wallet is looked up from the awarded bid's bidder.

**Step 1: Write the failing test**

Add to the `POST /api/tasks/[id]/accept` describe block in `tests/api/tasks/execution.test.ts`:

```typescript
// Add mock for solana instructions at the top level (alongside other mocks)
vi.mock('@/lib/solana/instructions', () => ({
  sendReleaseEscrow: vi.fn().mockResolvedValue('releaseTxSig'),
  sendRefundEscrow: vi.fn().mockResolvedValue('refundTxSig'),
}))

// Also need to mock agents lookup for wallet
// Update the db mock to handle agent lookup

// In the accept describe block, add:
it('calls sendReleaseEscrow when task has escrowAddress', async () => {
  const { sendReleaseEscrow } = await import('@/lib/solana/instructions')

  const taskWithEscrow = {
    ...taskFixture,
    status: 'submitted',
    escrowAddress: 'EscrowPdaAddr',
    awardedBidId: 'bid-uuid',
  }
  mockLimit
    .mockResolvedValueOnce([taskWithEscrow])  // task lookup
    .mockResolvedValueOnce([{ ...bidFixture, bidderId: 'worker-uuid' }])  // bid lookup
    .mockResolvedValueOnce([{ walletAddress: 'WorkerWallet123' }])  // agent lookup
  mockSetReturning.mockResolvedValue([{ ...taskWithEscrow, status: 'accepted' }])

  const request = makeRequest('http://localhost/api/tasks/task-uuid/accept', {})
  const response = await acceptPOST(request, { params: paramsPromise })

  expect(response.status).toBe(200)
  expect(sendReleaseEscrow).toHaveBeenCalledWith(
    'task-uuid',
    expect.anything() // PublicKey of worker wallet
  )
})

it('skips escrow release when task has no escrowAddress', async () => {
  const { sendReleaseEscrow } = await import('@/lib/solana/instructions')

  mockLimit.mockResolvedValue([{ ...taskFixture, status: 'submitted', escrowAddress: null }])
  mockSetReturning.mockResolvedValue([{ ...taskFixture, status: 'accepted' }])

  const request = makeRequest('http://localhost/api/tasks/task-uuid/accept', {})
  const response = await acceptPOST(request, { params: paramsPromise })

  expect(response.status).toBe(200)
  expect(sendReleaseEscrow).not.toHaveBeenCalled()
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/api/tasks/execution.test.ts`
Expected: FAIL — sendReleaseEscrow not called

**Step 3: Write the implementation**

Update `src/app/api/tasks/[id]/accept/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { tasks, bids, agents, TaskStatus } from '@/lib/db/schema'
import { isValidTransition } from '@/lib/services/task-service'
import { eq, and } from 'drizzle-orm'
import { sendReleaseEscrow } from '@/lib/solana/instructions'
import { PublicKey } from '@solana/web3.js'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (task.publisherId !== auth.id) {
    return NextResponse.json(
      { error: 'Only the publisher can accept deliverables' },
      { status: 403 }
    )
  }

  if (!isValidTransition(task.status, TaskStatus.ACCEPTED)) {
    return NextResponse.json(
      { error: `Cannot accept task with status "${task.status}"` },
      { status: 409 }
    )
  }

  // Release escrow if task has on-chain escrow
  let releaseTx: string | undefined
  if (task.escrowAddress && task.awardedBidId) {
    // Look up worker wallet
    const [bid] = await db
      .select()
      .from(bids)
      .where(eq(bids.id, task.awardedBidId))
      .limit(1)

    if (bid) {
      const [worker] = await db
        .select({ walletAddress: agents.walletAddress })
        .from(agents)
        .where(eq(agents.id, bid.bidderId))
        .limit(1)

      if (worker?.walletAddress) {
        releaseTx = await sendReleaseEscrow(
          id,
          new PublicKey(worker.walletAddress)
        )
      }
    }
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: TaskStatus.ACCEPTED })
    .where(and(eq(tasks.id, id), eq(tasks.publisherId, auth.id)))
    .returning()

  return NextResponse.json({ ...updated, releaseTx })
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/api/tasks/execution.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/app/api/tasks/[id]/accept/route.ts tests/api/tasks/execution.test.ts
git commit -m "feat(api): release escrow on task accept"
```

---

### Task 10: Reject Route — Refund Escrow

**Files:**
- Modify: `src/app/api/tasks/[id]/reject/route.ts`
- Modify: `tests/api/tasks/execution.test.ts`

**Step 1: Write the failing test**

Add to the reject describe block in `tests/api/tasks/execution.test.ts`:

```typescript
it('calls sendRefundEscrow when task has escrowAddress', async () => {
  const { sendRefundEscrow } = await import('@/lib/solana/instructions')

  const taskWithEscrow = {
    ...taskFixture,
    status: 'submitted',
    publisherId: 'agent-uuid',
    escrowAddress: 'EscrowPdaAddr',
  }
  mockLimit.mockResolvedValue([taskWithEscrow])
  mockSetReturning.mockResolvedValue([{ ...taskWithEscrow, status: 'rejected' }])

  // Mock agent lookup for publisher wallet
  // (may need to adjust mock chain depending on existing setup)

  const request = makeRequest('http://localhost/api/tasks/task-uuid/reject', {
    reason: 'Incomplete',
  })
  const response = await rejectPOST(request, { params: paramsPromise })

  expect(response.status).toBe(200)
  expect(sendRefundEscrow).toHaveBeenCalled()
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/api/tasks/execution.test.ts`
Expected: FAIL

**Step 3: Write the implementation**

Update `src/app/api/tasks/[id]/reject/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { tasks, agents, TaskStatus } from '@/lib/db/schema'
import { isValidTransition } from '@/lib/services/task-service'
import { eq, and } from 'drizzle-orm'
import { sendRefundEscrow } from '@/lib/solana/instructions'
import { PublicKey } from '@solana/web3.js'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const body = await request.json()

  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (task.publisherId !== auth.id) {
    return NextResponse.json(
      { error: 'Only the publisher can reject deliverables' },
      { status: 403 }
    )
  }

  if (!isValidTransition(task.status, TaskStatus.REJECTED)) {
    return NextResponse.json(
      { error: `Cannot reject task with status "${task.status}"` },
      { status: 409 }
    )
  }

  // Refund escrow if task has on-chain escrow
  let refundTx: string | undefined
  if (task.escrowAddress) {
    const [publisher] = await db
      .select({ walletAddress: agents.walletAddress })
      .from(agents)
      .where(eq(agents.id, task.publisherId))
      .limit(1)

    if (publisher?.walletAddress) {
      refundTx = await sendRefundEscrow(
        id,
        new PublicKey(publisher.walletAddress)
      )
    }
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: TaskStatus.REJECTED })
    .where(and(eq(tasks.id, id), eq(tasks.publisherId, auth.id)))
    .returning()

  return NextResponse.json({ task: updated, reason: body.reason ?? null, refundTx })
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/api/tasks/execution.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/app/api/tasks/[id]/reject/route.ts tests/api/tasks/execution.test.ts
git commit -m "feat(api): refund escrow on task reject"
```

---

### Task 11: Cancel Route — Refund Escrow

**Files:**
- Modify: `src/app/api/tasks/[id]/cancel/route.ts`
- Create: `tests/api/tasks/cancel-escrow.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/api/tasks/cancel-escrow.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSetReturning = vi.fn()
const mockSet = vi.fn().mockReturnValue({
  where: vi.fn().mockReturnValue({ returning: mockSetReturning }),
})
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

const mockLimit = vi.fn()
const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

vi.mock('@/lib/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}))

vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({
    id: 'agent-uuid',
    name: 'TestAgent',
    walletAddress: 'PublisherWallet',
  }),
}))

vi.mock('@/lib/services/task-service', () => ({
  isValidTransition: vi.fn().mockReturnValue(true),
}))

vi.mock('@/lib/solana/instructions', () => ({
  sendRefundEscrow: vi.fn().mockResolvedValue('refundTxSig'),
}))

import { PATCH } from '@/app/api/tasks/[id]/cancel/route'
import { sendRefundEscrow } from '@/lib/solana/instructions'

const paramsPromise = Promise.resolve({ id: 'task-uuid' })

function makeRequest(url: string) {
  return new Request(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer agl_test',
    },
  }) as unknown as import('next/server').NextRequest
}

describe('PATCH /api/tasks/[id]/cancel with escrow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls sendRefundEscrow when task has escrowAddress', async () => {
    mockLimit
      .mockResolvedValueOnce([{
        id: 'task-uuid',
        publisherId: 'agent-uuid',
        status: 'open',
        escrowAddress: 'EscrowPdaAddr',
      }])
      .mockResolvedValueOnce([{ walletAddress: 'PublisherWallet' }])  // agent lookup
    mockSetReturning.mockResolvedValue([{
      id: 'task-uuid',
      status: 'cancelled',
    }])

    const request = makeRequest('http://localhost/api/tasks/task-uuid/cancel')
    const response = await PATCH(request, { params: paramsPromise })

    expect(response.status).toBe(200)
    expect(sendRefundEscrow).toHaveBeenCalled()
  })

  it('skips refund when task has no escrowAddress', async () => {
    mockLimit.mockResolvedValueOnce([{
      id: 'task-uuid',
      publisherId: 'agent-uuid',
      status: 'open',
      escrowAddress: null,
    }])
    mockSetReturning.mockResolvedValue([{
      id: 'task-uuid',
      status: 'cancelled',
    }])

    const request = makeRequest('http://localhost/api/tasks/task-uuid/cancel')
    const response = await PATCH(request, { params: paramsPromise })

    expect(response.status).toBe(200)
    expect(sendRefundEscrow).not.toHaveBeenCalled()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/api/tasks/cancel-escrow.test.ts`
Expected: FAIL

**Step 3: Write the implementation**

Update `src/app/api/tasks/[id]/cancel/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { tasks, agents, TaskStatus } from '@/lib/db/schema'
import { isValidTransition } from '@/lib/services/task-service'
import { eq, and } from 'drizzle-orm'
import { sendRefundEscrow } from '@/lib/solana/instructions'
import { PublicKey } from '@solana/web3.js'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (task.publisherId !== auth.id) {
    return NextResponse.json(
      { error: 'Only the publisher can cancel this task' },
      { status: 403 }
    )
  }

  if (!isValidTransition(task.status, TaskStatus.CANCELLED)) {
    return NextResponse.json(
      { error: `Cannot cancel task with status "${task.status}"` },
      { status: 409 }
    )
  }

  // Refund escrow if task has on-chain escrow
  let refundTx: string | undefined
  if (task.escrowAddress) {
    const [publisher] = await db
      .select({ walletAddress: agents.walletAddress })
      .from(agents)
      .where(eq(agents.id, task.publisherId))
      .limit(1)

    if (publisher?.walletAddress) {
      refundTx = await sendRefundEscrow(
        id,
        new PublicKey(publisher.walletAddress)
      )
    }
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: TaskStatus.CANCELLED })
    .where(and(eq(tasks.id, id), eq(tasks.publisherId, auth.id)))
    .returning()

  return NextResponse.json({ ...updated, refundTx })
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/api/tasks/cancel-escrow.test.ts`
Expected: All PASS

**Step 5: Run ALL tests to verify nothing broke**

Run: `pnpm vitest run`
Expected: All existing + new tests PASS

**Step 6: Commit**

```bash
git add src/app/api/tasks/[id]/cancel/route.ts tests/api/tasks/cancel-escrow.test.ts
git commit -m "feat(api): refund escrow on task cancel"
```

---

## Phase 4: Docs, Config & Deploy

### Task 12: Update API Docs

**Files:**
- Modify: `src/lib/api-docs.ts`

**Step 1: Add escrow/prepare endpoint to api-docs**

In `src/lib/api-docs.ts`, add a new group after the Authentication group:

```typescript
// Add after Authentication group, before Agents group
{
  name: 'Escrow',
  description:
    'Prepare escrow parameters for on-chain USDC locking. ' +
    'The Agent generates a task UUID, calls /api/escrow/prepare to get PDA and vault addresses, ' +
    'builds and signs a create_escrow transaction locally, sends it to Solana, then creates the task via POST /api/tasks with the escrow_tx.',
  endpoints: [
    {
      method: 'GET',
      path: '/api/escrow/prepare',
      summary: 'Get escrow creation parameters',
      description:
        'Returns all parameters needed to build a create_escrow transaction: PDA address, vault token account, USDC mint, platform wallet, fees, and program ID.',
      auth: true,
      params: [
        { name: 'task_id', type: 'string (UUID)', required: true, description: 'Pre-generated task UUID to derive escrow PDA' },
      ],
      responseExample: {
        escrow_pda: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        escrow_bump: 254,
        vault_address: '9yZXtg3DW98e07UYKTdpbE6kCkhfTrB94UZSvKthBsW',
        platform_token: 'AbcDeFgHiJkLmNoPqRsTuVwXyZ123456789012345678',
        usdc_mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
        platform_wallet: 'D1yNArYHmypsKNph46i2Zpa9m7sHYtdXzkxYrP1vswfQ',
        platform_authority: 'PLatFormAuThOrItYpUbKeY12345678901234567890',
        program_id: 'F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh',
        listing_fee: 2000000,
        fee_bps: 500,
      },
      errorCodes: [
        { status: 400, description: 'Missing task_id parameter' },
        { status: 401, description: 'Missing or invalid API key' },
      ],
    },
  ],
},
```

Also update the `POST /api/tasks` endpoint docs to include the new escrow fields:

Add to the Tasks POST params:
```typescript
{ name: 'id', type: 'string (UUID)', required: false, description: 'Pre-generated task UUID (required when escrow_tx is provided)' },
{ name: 'escrow_tx', type: 'string', required: false, description: 'Solana transaction signature of the create_escrow transaction' },
```

**Step 2: Run the existing openapi test**

Run: `pnpm vitest run tests/api/openapi/openapi.test.ts`
Expected: PASS (if test just checks structure, it should still pass)

**Step 3: Commit**

```bash
git add src/lib/api-docs.ts
git commit -m "docs(api): add escrow/prepare endpoint and escrow_tx field"
```

---

### Task 13: Environment Variables + Deploy

**Files:**
- Modify: `.env` (local, do NOT commit)
- Vercel dashboard (environment variables)

**Step 1: Generate platform authority keypair**

Run locally:
```bash
solana-keygen new --outfile /tmp/platform-authority.json --no-bip39-passphrase
# Note the pubkey printed
# Convert to base58 for env var:
node -e "
  const fs = require('fs');
  const bs58 = require('bs58');
  const key = JSON.parse(fs.readFileSync('/tmp/platform-authority.json'));
  console.log('PLATFORM_AUTHORITY_KEYPAIR=' + bs58.default.encode(Buffer.from(key)));
  const { Keypair } = require('@solana/web3.js');
  const kp = Keypair.fromSecretKey(Buffer.from(key));
  console.log('PLATFORM_AUTHORITY_PUBKEY=' + kp.publicKey.toBase58());
"
```

**Step 2: Add to .env**

Append to `.env`:
```
PLATFORM_AUTHORITY_KEYPAIR=<base58 secret key from above>
PLATFORM_AUTHORITY_PUBKEY=<pubkey from above>
USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

**Step 3: Add to Vercel**

In Vercel dashboard → Settings → Environment Variables, add:
- `PLATFORM_AUTHORITY_KEYPAIR` = (the base58 secret key)
- `PLATFORM_AUTHORITY_PUBKEY` = (the corresponding pubkey)
- `USDC_MINT_ADDRESS` = `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

**Step 4: Deploy**

```bash
git push
```
Or use Vercel CLI: `vercel --prod`

**Step 5: Verify deploy**

```bash
curl -s https://aglabor.vercel.app/api/escrow/prepare?task_id=test-uuid \
  -H "Authorization: Bearer <your_api_key>" | jq .
```
Expected: Returns escrow params JSON with valid PDA and vault addresses.

---

## Summary of All New/Modified Files

| File | Action | Purpose |
|------|--------|---------|
| `programs/escrow/src/lib.rs` | Modify | platform_authority model, remove assign_worker |
| `src/lib/solana/idl/escrow.json` | Create | New IDL from build |
| `src/lib/solana/platform-authority.ts` | Create | Load platform keypair from env |
| `src/lib/solana/escrow.ts` | Modify | Add parseEscrowAccount deserialization |
| `src/lib/solana/instructions.ts` | Create | Build + send release/refund transactions |
| `src/app/api/escrow/prepare/route.ts` | Create | GET /api/escrow/prepare |
| `src/app/api/tasks/route.ts` | Modify | Verify on-chain escrow in POST |
| `src/app/api/tasks/[id]/accept/route.ts` | Modify | Call releaseEscrow |
| `src/app/api/tasks/[id]/reject/route.ts` | Modify | Call refundEscrow |
| `src/app/api/tasks/[id]/cancel/route.ts` | Modify | Call refundEscrow |
| `src/lib/api-docs.ts` | Modify | Add escrow docs |
| `.env` | Modify | Add PLATFORM_AUTHORITY_*, USDC_MINT |

## Test Files

| File | Action |
|------|--------|
| `tests/lib/solana/platform-authority.test.ts` | Create |
| `tests/lib/solana/escrow.test.ts` | Modify |
| `tests/lib/solana/instructions.test.ts` | Create |
| `tests/api/escrow/prepare.test.ts` | Create |
| `tests/api/tasks/escrow-create.test.ts` | Create |
| `tests/api/tasks/execution.test.ts` | Modify |
| `tests/api/tasks/cancel-escrow.test.ts` | Create |
