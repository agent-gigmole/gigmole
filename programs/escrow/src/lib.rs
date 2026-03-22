use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh"); // placeholder, update after build

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
        // MED-02: fee_bps 上限 10%
        require!(fee_bps <= 1000, EscrowError::FeeBpsTooHigh);

        let escrow = &mut ctx.accounts.escrow;
        escrow.publisher = ctx.accounts.publisher.key();
        escrow.platform_authority = ctx.accounts.platform_authority.key();
        // CRIT-03: 存储 USDC mint 地址
        escrow.usdc_mint = ctx.accounts.usdc_mint.key();
        escrow.amount = amount - listing_fee;
        escrow.listing_fee = listing_fee;
        escrow.fee_bps = fee_bps;
        escrow.task_id = task_id;
        escrow.status = EscrowStatus::Funded;
        // CRIT-04: worker 字段默认值，后续通过 set_worker 设置
        escrow.worker = Pubkey::default();
        escrow.bump = ctx.bumps.escrow;

        // Transfer total amount from publisher to vault
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

    // CRIT-04: 设置 worker 的指令
    pub fn set_worker(ctx: Context<SetWorker>, _task_id: String, worker: Pubkey) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.status == EscrowStatus::Funded, EscrowError::InvalidStatus);
        require!(escrow.worker == Pubkey::default(), EscrowError::WorkerAlreadySet);
        escrow.worker = worker;
        Ok(())
    }

    pub fn release_escrow(ctx: Context<ReleaseEscrow>, _task_id: String) -> Result<()> {
        // Read values before taking any borrows for transfers
        let escrow_status = ctx.accounts.escrow.status.clone();
        let escrow_amount = ctx.accounts.escrow.amount;
        let escrow_fee_bps = ctx.accounts.escrow.fee_bps;
        let escrow_task_id = ctx.accounts.escrow.task_id.clone();
        let escrow_bump = ctx.accounts.escrow.bump;
        let escrow_worker = ctx.accounts.escrow.worker;

        require!(escrow_status == EscrowStatus::Funded, EscrowError::InvalidStatus);

        // CRIT-04: 验证 worker 已设置且 worker_token 归属正确
        require!(escrow_worker != Pubkey::default(), EscrowError::WorkerNotSet);
        require!(
            ctx.accounts.worker_token.owner == escrow_worker,
            EscrowError::Unauthorized
        );

        // CRIT-05: 安全的整数运算，避免溢出
        let fee = escrow_amount
            .checked_mul(escrow_fee_bps as u64)
            .ok_or(EscrowError::MathOverflow)?
            .checked_div(10000)
            .ok_or(EscrowError::MathOverflow)?;
        let payout = escrow_amount
            .checked_sub(fee)
            .ok_or(EscrowError::MathOverflow)?;

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

        // Transfer fee to platform
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
        // Read values before taking any borrows for transfers
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

// MED-04: 添加 #[repr(u8)] 确保序列化确定性
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
#[repr(u8)]
pub enum EscrowStatus {
    Funded = 0,
    Released = 1,
    Refunded = 2,
}

#[account]
pub struct Escrow {
    pub publisher: Pubkey,
    pub platform_authority: Pubkey,
    // CRIT-03: 存储 USDC mint 地址
    pub usdc_mint: Pubkey,
    pub amount: u64,
    pub listing_fee: u64,
    pub fee_bps: u16,
    pub task_id: String,
    pub status: EscrowStatus,
    // CRIT-04: worker 字段
    pub worker: Pubkey,
    pub bump: u8,
}

impl Escrow {
    // 32 (publisher) + 32 (platform_authority) + 32 (usdc_mint) + 8 (amount) + 8 (listing_fee)
    // + 2 (fee_bps) + (4 + 64) (task_id) + 1 (status) + 32 (worker) + 1 (bump) = 216
    pub const MAX_SIZE: usize = 32 + 32 + 32 + 8 + 8 + 2 + (4 + 64) + 1 + 32 + 1;
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
    /// CHECK: Platform authority pubkey, stored in escrow for future authorization
    pub platform_authority: AccountInfo<'info>,
    // CRIT-03: USDC mint 账户
    pub usdc_mint: Account<'info, Mint>,
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = publisher,
    )]
    pub publisher_token: Account<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = usdc_mint,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = usdc_mint,
    )]
    pub platform_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// CRIT-04: SetWorker 账户结构体
#[derive(Accounts)]
#[instruction(_task_id: String)]
pub struct SetWorker<'info> {
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
    // CRIT-02: usdc_mint 用于验证 token 账户
    #[account(
        constraint = usdc_mint.key() == escrow.usdc_mint @ EscrowError::InvalidMint
    )]
    pub usdc_mint: Account<'info, Mint>,
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = escrow,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = usdc_mint,
    )]
    pub worker_token: Account<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = escrow.platform_authority,
    )]
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
    // HIGH-01: 验证 vault 和 publisher_token 的 mint 和归属
    #[account(
        constraint = usdc_mint.key() == escrow.usdc_mint @ EscrowError::InvalidMint
    )]
    pub usdc_mint: Account<'info, Mint>,
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = escrow,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = escrow.publisher,
    )]
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
    #[msg("Fee basis points too high (max 1000 = 10%)")]
    FeeBpsTooHigh,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Worker not set")]
    WorkerNotSet,
    #[msg("Worker already assigned")]
    WorkerAlreadySet,
    #[msg("Invalid USDC mint")]
    InvalidMint,
}
