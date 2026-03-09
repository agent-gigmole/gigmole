use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

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

        let escrow = &mut ctx.accounts.escrow;
        escrow.publisher = ctx.accounts.publisher.key();
        escrow.platform_authority = ctx.accounts.platform_authority.key();
        escrow.amount = amount - listing_fee;
        escrow.listing_fee = listing_fee;
        escrow.fee_bps = fee_bps;
        escrow.task_id = task_id;
        escrow.status = EscrowStatus::Funded;
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

    pub fn release_escrow(ctx: Context<ReleaseEscrow>, _task_id: String) -> Result<()> {
        // Read values before taking any borrows for transfers
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowStatus {
    Funded,
    Released,
    Refunded,
}

#[account]
pub struct Escrow {
    pub publisher: Pubkey,
    pub platform_authority: Pubkey,
    pub amount: u64,
    pub listing_fee: u64,
    pub fee_bps: u16,
    pub task_id: String,
    pub status: EscrowStatus,
    pub bump: u8,
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
    /// CHECK: Platform authority pubkey, stored in escrow for future authorization
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
