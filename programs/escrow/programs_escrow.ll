; ModuleID = 'LLVMDialectModule'
source_filename = "LLVMDialectModule"

@"mut,token::mint=usdc_mint,token::authority=escrow.publisher," = internal constant [60 x i8] c"mut,token::mint=usdc_mint,token::authority=escrow.publisher,"
@"mut,token::mint=usdc_mint,token::authority=escrow.platform_authority," = internal constant [69 x i8] c"mut,token::mint=usdc_mint,token::authority=escrow.platform_authority,"
@worker_token = internal constant [12 x i8] c"worker_token"
@"mut,token::mint=usdc_mint,token::authority=escrow," = internal constant [50 x i8] c"mut,token::mint=usdc_mint,token::authority=escrow,"
@"constraint=usdc_mint.key()==escrow.usdc_mint@EscrowError::InvalidMint" = internal constant [69 x i8] c"constraint=usdc_mint.key()==escrow.usdc_mint@EscrowError::InvalidMint"
@"constraint=platform_authority.key()==escrow.platform_authority@EscrowError::Unauthorized" = internal constant [88 x i8] c"constraint=platform_authority.key()==escrow.platform_authority@EscrowError::Unauthorized"
@"mut,seeds=[b\22escrow\22,_task_id.as_bytes()],bump=escrow.bump" = internal constant [58 x i8] c"mut,seeds=[b\22escrow\22,_task_id.as_bytes()],bump=escrow.bump"
@"Program<'info,System>" = internal constant [21 x i8] c"Program<'info,System>"
@system_program = internal constant [14 x i8] c"system_program"
@"Program<'info,Token>" = internal constant [20 x i8] c"Program<'info,Token>"
@token_program = internal constant [13 x i8] c"token_program"
@platform_token = internal constant [14 x i8] c"platform_token"
@vault = internal constant [5 x i8] c"vault"
@"mut,token::mint=usdc_mint," = internal constant [26 x i8] c"mut,token::mint=usdc_mint,"
@"Account<'info,TokenAccount>" = internal constant [27 x i8] c"Account<'info,TokenAccount>"
@publisher_token = internal constant [15 x i8] c"publisher_token"
@"mut,token::mint=usdc_mint,token::authority=publisher," = internal constant [53 x i8] c"mut,token::mint=usdc_mint,token::authority=publisher,"
@"Account<'info,Mint>" = internal constant [19 x i8] c"Account<'info,Mint>"
@"AccountInfo<'info>" = internal constant [18 x i8] c"AccountInfo<'info>"
@"Signer<'info>" = internal constant [13 x i8] c"Signer<'info>"
@mut = internal constant [3 x i8] c"mut"
@"Account<'info,Escrow>" = internal constant [21 x i8] c"Account<'info,Escrow>"
@"init,payer=publisher,space=8+Escrow::MAX_SIZE,seeds=[b\22escrow\22,task_id.as_bytes()],bump" = internal constant [87 x i8] c"init,payer=publisher,space=8+Escrow::MAX_SIZE,seeds=[b\22escrow\22,task_id.as_bytes()],bump"
@u8 = internal constant [2 x i8] c"u8"
@bump = internal constant [4 x i8] c"bump"
@EscrowStatus = internal constant [12 x i8] c"EscrowStatus"
@status = internal constant [6 x i8] c"status"
@usdc_mint = internal constant [9 x i8] c"usdc_mint"
@platform_authority = internal constant [18 x i8] c"platform_authority"
@publisher = internal constant [9 x i8] c"publisher"
@program_id = internal constant [10 x i8] c"program_id"
@"ctx:Context<RefundEscrow>" = internal constant [25 x i8] c"ctx:Context<RefundEscrow>"
@"ctx:Context<ReleaseEscrow>" = internal constant [26 x i8] c"ctx:Context<ReleaseEscrow>"
@"worker:Pubkey" = internal constant [13 x i8] c"worker:Pubkey"
@"_task_id:String" = internal constant [15 x i8] c"_task_id:String"
@"ctx:Context<SetWorker>" = internal constant [22 x i8] c"ctx:Context<SetWorker>"
@"fee_bps:u16" = internal constant [11 x i8] c"fee_bps:u16"
@"listing_fee:u64" = internal constant [15 x i8] c"listing_fee:u64"
@"amount:u64" = internal constant [10 x i8] c"amount:u64"
@"task_id:String" = internal constant [14 x i8] c"task_id:String"
@"ctx:Context<CreateEscrow>" = internal constant [25 x i8] c"ctx:Context<CreateEscrow>"
@"EscrowStatus::Refunded" = internal constant [22 x i8] c"EscrowStatus::Refunded"
@transfer_refund = internal constant [15 x i8] c"transfer_refund"
@"Context<RefundEscrow>" = internal constant [21 x i8] c"Context<RefundEscrow>"
@"EscrowStatus::Released" = internal constant [22 x i8] c"EscrowStatus::Released"
@transfer_payout = internal constant [15 x i8] c"transfer_payout"
@ctx.accounts.worker_token = internal constant [25 x i8] c"ctx.accounts.worker_token"
@"[&seeds[..]]" = internal constant [12 x i8] c"[&seeds[..]]"
@seeds = internal constant [5 x i8] c"seeds"
@"[b\22escrow\22.as_ref(),task_id_bytes.as_slice(),&[escrow_bump]]" = internal constant [60 x i8] c"[b\22escrow\22.as_ref(),task_id_bytes.as_slice(),&[escrow_bump]]"
@task_id_bytes = internal constant [13 x i8] c"task_id_bytes"
@payout = internal constant [6 x i8] c"payout"
@"10000" = internal constant [5 x i8] c"10000"
@"EscrowError::MathOverflow" = internal constant [25 x i8] c"EscrowError::MathOverflow"
@"EscrowError::Unauthorized" = internal constant [25 x i8] c"EscrowError::Unauthorized"
@"ctx.accounts.worker_token.owner==escrow_worker" = internal constant [46 x i8] c"ctx.accounts.worker_token.owner==escrow_worker"
@"EscrowError::WorkerNotSet" = internal constant [25 x i8] c"EscrowError::WorkerNotSet"
@"escrow_worker!=Pubkey::default()" = internal constant [32 x i8] c"escrow_worker!=Pubkey::default()"
@"escrow_status==EscrowStatus::Funded" = internal constant [35 x i8] c"escrow_status==EscrowStatus::Funded"
@escrow_worker = internal constant [13 x i8] c"escrow_worker"
@ctx.accounts.escrow.worker = internal constant [26 x i8] c"ctx.accounts.escrow.worker"
@escrow_bump = internal constant [11 x i8] c"escrow_bump"
@ctx.accounts.escrow.bump = internal constant [24 x i8] c"ctx.accounts.escrow.bump"
@escrow_task_id = internal constant [14 x i8] c"escrow_task_id"
@ctx.accounts.escrow.task_id = internal constant [27 x i8] c"ctx.accounts.escrow.task_id"
@escrow_fee_bps = internal constant [14 x i8] c"escrow_fee_bps"
@ctx.accounts.escrow.fee_bps = internal constant [27 x i8] c"ctx.accounts.escrow.fee_bps"
@escrow_amount = internal constant [13 x i8] c"escrow_amount"
@ctx.accounts.escrow.amount = internal constant [26 x i8] c"ctx.accounts.escrow.amount"
@escrow_status = internal constant [13 x i8] c"escrow_status"
@ctx.accounts.escrow.status = internal constant [26 x i8] c"ctx.accounts.escrow.status"
@"Context<ReleaseEscrow>" = internal constant [22 x i8] c"Context<ReleaseEscrow>"
@fee = internal constant [3 x i8] c"fee"
@signer_seeds = internal constant [12 x i8] c"signer_seeds"
@"EscrowError::WorkerAlreadySet" = internal constant [29 x i8] c"EscrowError::WorkerAlreadySet"
@"escrow.worker==Pubkey::default()" = internal constant [32 x i8] c"escrow.worker==Pubkey::default()"
@"EscrowError::InvalidStatus" = internal constant [26 x i8] c"EscrowError::InvalidStatus"
@"escrow.status==EscrowStatus::Funded" = internal constant [35 x i8] c"escrow.status==EscrowStatus::Funded"
@Pubkey = internal constant [6 x i8] c"Pubkey"
@worker = internal constant [6 x i8] c"worker"
@_task_id = internal constant [8 x i8] c"_task_id"
@"Context<SetWorker>" = internal constant [18 x i8] c"Context<SetWorker>"
@"()" = internal constant [2 x i8] c"()"
@"0" = internal constant [1 x i8] c"0"
@transfer_to_vault = internal constant [17 x i8] c"transfer_to_vault"
@ctx.accounts.vault = internal constant [18 x i8] c"ctx.accounts.vault"
@escrow.bump = internal constant [11 x i8] c"escrow.bump"
@ctx.bumps.escrow = internal constant [16 x i8] c"ctx.bumps.escrow"
@escrow.worker = internal constant [13 x i8] c"escrow.worker"
@escrow.status = internal constant [13 x i8] c"escrow.status"
@"EscrowStatus::Funded" = internal constant [20 x i8] c"EscrowStatus::Funded"
@escrow.task_id = internal constant [14 x i8] c"escrow.task_id"
@escrow.fee_bps = internal constant [14 x i8] c"escrow.fee_bps"
@escrow.listing_fee = internal constant [18 x i8] c"escrow.listing_fee"
@escrow.amount = internal constant [13 x i8] c"escrow.amount"
@escrow.usdc_mint = internal constant [16 x i8] c"escrow.usdc_mint"
@ctx.accounts.usdc_mint = internal constant [22 x i8] c"ctx.accounts.usdc_mint"
@escrow.platform_authority = internal constant [25 x i8] c"escrow.platform_authority"
@ctx.accounts.platform_authority = internal constant [31 x i8] c"ctx.accounts.platform_authority"
@escrow.publisher = internal constant [16 x i8] c"escrow.publisher"
@escrow = internal constant [6 x i8] c"escrow"
@ctx.accounts.escrow = internal constant [19 x i8] c"ctx.accounts.escrow"
@"EscrowError::FeeBpsTooHigh" = internal constant [26 x i8] c"EscrowError::FeeBpsTooHigh"
@"fee_bps<=1000" = internal constant [13 x i8] c"fee_bps<=1000"
@"EscrowError::InsufficientAmount" = internal constant [31 x i8] c"EscrowError::InsufficientAmount"
@"amount>listing_fee" = internal constant [18 x i8] c"amount>listing_fee"
@"EscrowError::TaskIdTooLong" = internal constant [26 x i8] c"EscrowError::TaskIdTooLong"
@"task_id.len()<=64" = internal constant [17 x i8] c"task_id.len()<=64"
@u16 = internal constant [3 x i8] c"u16"
@fee_bps = internal constant [7 x i8] c"fee_bps"
@u64 = internal constant [3 x i8] c"u64"
@amount = internal constant [6 x i8] c"amount"
@String = internal constant [6 x i8] c"String"
@task_id = internal constant [7 x i8] c"task_id"
@"Context<CreateEscrow>" = internal constant [21 x i8] c"Context<CreateEscrow>"
@ctx = internal constant [3 x i8] c"ctx"
@listing_fee = internal constant [11 x i8] c"listing_fee"
@ctx.accounts.token_program = internal constant [26 x i8] c"ctx.accounts.token_program"
@transfer_fee = internal constant [12 x i8] c"transfer_fee"
@authority = internal constant [9 x i8] c"authority"
@ctx.accounts.publisher = internal constant [22 x i8] c"ctx.accounts.publisher"
@to = internal constant [2 x i8] c"to"
@ctx.accounts.platform_token = internal constant [27 x i8] c"ctx.accounts.platform_token"
@from = internal constant [4 x i8] c"from"
@ctx.accounts.publisher_token = internal constant [28 x i8] c"ctx.accounts.publisher_token"
@"*i8" = internal constant [3 x i8] c"*i8"
@parser.error = internal constant [12 x i8] c"parser.error"
@F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh = internal constant [44 x i8] c"F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh"
@dependencies.anchor-spl.version = internal constant [31 x i8] c"dependencies.anchor-spl.version"
@"0.30.1" = internal constant [6 x i8] c"0.30.1"
@dependencies.anchor-lang.version = internal constant [32 x i8] c"dependencies.anchor-lang.version"

declare i8* @malloc(i64)

declare void @free(i8*)

declare i8* @sol.model.struct.constraint(i8*)

declare i8* @sol.model.struct.field(i8*, i8*)

declare i8* @sol.refund_escrow.2(i8*, i8*)

declare i8* @sol.release_escrow.2(i8*, i8*)

declare i8* @sol.set_worker.3(i8*, i8*, i8*)

declare i8* @sol.create_escrow.5(i8*, i8*, i8*, i8*, i8*)

declare i8* @"sol.lib::release_escrow.anon.1"(i8*)

declare i8* @sol.to_vec.1(i8*)

declare i8* @sol.as_bytes.1(i8*)

declare i8* @sol.checked_sub.2(i8*, i8*)

declare i8* @sol.checked_div.2(i8*, i8*)

declare i8* @sol.ok_or.2(i8*, i8*)

declare i8* @sol.checked_mul.2(i8*, i8*)

declare i8* @sol.typecast(i8*, i8*)

declare i8* @sol.clone.1(i8*)

declare i8* @"sol.CpiContext::new_with_signer.3"(i8*, i8*, i8*)

declare i8* @sol.Ok.1(i8*)

declare i8* @sol.ifTrue.anon.(i8*)

declare i8* @"sol.lib::create_escrow.anon.1"(i8*)

declare i8* @sol.if(i8*)

declare i8* @"sol.>"(i8*, i8*)

declare i8* @"sol.Pubkey::default.0"()

declare i8* @sol.-(i8*, i8*)

declare i8* @sol.key.1(i8*)

declare i8* @"sol.require.!2"(i8*, i8*)

declare i8* @"sol.token::transfer.2"(i8*, i8*)

declare i8* @"sol.CpiContext::new.2"(i8*, i8*)

declare i8* @sol.model.struct.new.Transfer.3(i8*, i8*, i8*)

declare void @sol.model.opaqueAssign(i8*, i8*)

declare i8* @sol.to_account_info.1(i8*)

declare i8* @sol.model.funcArg(i8*, i8*)

declare i8* @sol.model.declare_id(i8*)

declare i8* @sol.model.toml(i8*, i8*)

define i64 @sol.model.cargo.toml(i8* %0) !dbg !3 {
  %2 = call i8* @sol.model.toml(i8* getelementptr inbounds ([32 x i8], [32 x i8]* @dependencies.anchor-lang.version, i64 0, i64 0), i8* getelementptr inbounds ([6 x i8], [6 x i8]* @"0.30.1", i64 0, i64 0)), !dbg !7
  %3 = call i8* @sol.model.toml(i8* getelementptr inbounds ([31 x i8], [31 x i8]* @dependencies.anchor-spl.version, i64 0, i64 0), i8* getelementptr inbounds ([6 x i8], [6 x i8]* @"0.30.1", i64 0, i64 0)), !dbg !7
  ret i64 0, !dbg !7
}

define i64 @sol.model.declare_id.address(i8* %0) !dbg !9 {
  %2 = call i8* @sol.model.declare_id(i8* getelementptr inbounds ([44 x i8], [44 x i8]* @F9hdevLubaFEGveio4w1EtftiyqVbuE4nTfc6Wb2xwJh, i64 0, i64 0)), !dbg !10
  ret i64 0, !dbg !13
}

define i8* @"lib::create_escrow.anon.1"(i8* %0) !dbg !15 {
  %2 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @parser.error, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @"*i8", i64 0, i64 0)), !dbg !17
  %3 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([28 x i8], [28 x i8]* @ctx.accounts.publisher_token, i64 0, i64 0)), !dbg !19
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @from, i64 0, i64 0), i8* %3), !dbg !20
  %4 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([27 x i8], [27 x i8]* @ctx.accounts.platform_token, i64 0, i64 0)), !dbg !21
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @to, i64 0, i64 0), i8* %4), !dbg !22
  %5 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([22 x i8], [22 x i8]* @ctx.accounts.publisher, i64 0, i64 0)), !dbg !23
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @authority, i64 0, i64 0), i8* %5), !dbg !24
  %6 = call i8* @sol.model.struct.new.Transfer.3(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @from, i64 0, i64 0), i8* getelementptr inbounds ([2 x i8], [2 x i8]* @to, i64 0, i64 0), i8* getelementptr inbounds ([9 x i8], [9 x i8]* @authority, i64 0, i64 0)), !dbg !25
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @transfer_fee, i64 0, i64 0), i8* %6), !dbg !26
  %7 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([26 x i8], [26 x i8]* @ctx.accounts.token_program, i64 0, i64 0)), !dbg !27
  %8 = call i8* @"sol.CpiContext::new.2"(i8* %7, i8* getelementptr inbounds ([12 x i8], [12 x i8]* @transfer_fee, i64 0, i64 0)), !dbg !28
  %9 = call i8* @"sol.token::transfer.2"(i8* %8, i8* getelementptr inbounds ([11 x i8], [11 x i8]* @listing_fee, i64 0, i64 0)), !dbg !29
  ret i8* %0, !dbg !17
}

define i8* @"lib::create_escrow.5"(i8* %0, i8* %1, i8* %2, i8* %3, i8* %4) !dbg !30 {
  %6 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @ctx, i64 0, i64 0), i8* getelementptr inbounds ([21 x i8], [21 x i8]* @"Context<CreateEscrow>", i64 0, i64 0)), !dbg !31
  %7 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([7 x i8], [7 x i8]* @task_id, i64 0, i64 0), i8* getelementptr inbounds ([6 x i8], [6 x i8]* @String, i64 0, i64 0)), !dbg !31
  %8 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([6 x i8], [6 x i8]* @amount, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @u64, i64 0, i64 0)), !dbg !31
  %9 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([11 x i8], [11 x i8]* @listing_fee, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @u64, i64 0, i64 0)), !dbg !31
  %10 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([7 x i8], [7 x i8]* @fee_bps, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @u16, i64 0, i64 0)), !dbg !31
  %11 = call i8* @"sol.require.!2"(i8* getelementptr inbounds ([17 x i8], [17 x i8]* @"task_id.len()<=64", i64 0, i64 0), i8* getelementptr inbounds ([26 x i8], [26 x i8]* @"EscrowError::TaskIdTooLong", i64 0, i64 0)), !dbg !33
  %12 = call i8* @"sol.require.!2"(i8* getelementptr inbounds ([18 x i8], [18 x i8]* @"amount>listing_fee", i64 0, i64 0), i8* getelementptr inbounds ([31 x i8], [31 x i8]* @"EscrowError::InsufficientAmount", i64 0, i64 0)), !dbg !34
  %13 = call i8* @"sol.require.!2"(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @"fee_bps<=1000", i64 0, i64 0), i8* getelementptr inbounds ([26 x i8], [26 x i8]* @"EscrowError::FeeBpsTooHigh", i64 0, i64 0)), !dbg !35
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([6 x i8], [6 x i8]* @escrow, i64 0, i64 0), i8* getelementptr inbounds ([19 x i8], [19 x i8]* @ctx.accounts.escrow, i64 0, i64 0)), !dbg !36
  %14 = call i8* @sol.key.1(i8* getelementptr inbounds ([22 x i8], [22 x i8]* @ctx.accounts.publisher, i64 0, i64 0)), !dbg !37
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([16 x i8], [16 x i8]* @escrow.publisher, i64 0, i64 0), i8* %14), !dbg !38
  %15 = call i8* @sol.key.1(i8* getelementptr inbounds ([31 x i8], [31 x i8]* @ctx.accounts.platform_authority, i64 0, i64 0)), !dbg !39
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([25 x i8], [25 x i8]* @escrow.platform_authority, i64 0, i64 0), i8* %15), !dbg !40
  %16 = call i8* @sol.key.1(i8* getelementptr inbounds ([22 x i8], [22 x i8]* @ctx.accounts.usdc_mint, i64 0, i64 0)), !dbg !41
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([16 x i8], [16 x i8]* @escrow.usdc_mint, i64 0, i64 0), i8* %16), !dbg !42
  %17 = call i8* @sol.-(i8* %2, i8* %3), !dbg !43
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @escrow.amount, i64 0, i64 0), i8* %17), !dbg !44
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([18 x i8], [18 x i8]* @escrow.listing_fee, i64 0, i64 0), i8* %3), !dbg !45
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([14 x i8], [14 x i8]* @escrow.fee_bps, i64 0, i64 0), i8* %4), !dbg !46
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([14 x i8], [14 x i8]* @escrow.task_id, i64 0, i64 0), i8* %1), !dbg !47
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @escrow.status, i64 0, i64 0), i8* getelementptr inbounds ([20 x i8], [20 x i8]* @"EscrowStatus::Funded", i64 0, i64 0)), !dbg !48
  %18 = call i8* @"sol.Pubkey::default.0"(), !dbg !49
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @escrow.worker, i64 0, i64 0), i8* %18), !dbg !50
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([11 x i8], [11 x i8]* @escrow.bump, i64 0, i64 0), i8* getelementptr inbounds ([16 x i8], [16 x i8]* @ctx.bumps.escrow, i64 0, i64 0)), !dbg !51
  %19 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([28 x i8], [28 x i8]* @ctx.accounts.publisher_token, i64 0, i64 0)), !dbg !52
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @from, i64 0, i64 0), i8* %19), !dbg !53
  %20 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([18 x i8], [18 x i8]* @ctx.accounts.vault, i64 0, i64 0)), !dbg !54
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @to, i64 0, i64 0), i8* %20), !dbg !55
  %21 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([22 x i8], [22 x i8]* @ctx.accounts.publisher, i64 0, i64 0)), !dbg !56
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @authority, i64 0, i64 0), i8* %21), !dbg !57
  %22 = call i8* @sol.model.struct.new.Transfer.3(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @from, i64 0, i64 0), i8* getelementptr inbounds ([2 x i8], [2 x i8]* @to, i64 0, i64 0), i8* getelementptr inbounds ([9 x i8], [9 x i8]* @authority, i64 0, i64 0)), !dbg !58
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([17 x i8], [17 x i8]* @transfer_to_vault, i64 0, i64 0), i8* %22), !dbg !59
  %23 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([26 x i8], [26 x i8]* @ctx.accounts.token_program, i64 0, i64 0)), !dbg !60
  %24 = call i8* @"sol.CpiContext::new.2"(i8* %23, i8* getelementptr inbounds ([17 x i8], [17 x i8]* @transfer_to_vault, i64 0, i64 0)), !dbg !61
  %25 = call i8* @sol.-(i8* %2, i8* %3), !dbg !62
  %26 = call i8* @"sol.token::transfer.2"(i8* %24, i8* %25), !dbg !63
  %27 = call i8* @"sol.>"(i8* %3, i8* getelementptr inbounds ([1 x i8], [1 x i8]* @"0", i64 0, i64 0)), !dbg !64
  %28 = call i8* @sol.if(i8* %27), !dbg !65
  %29 = call i8* @"sol.lib::create_escrow.anon.1"(i8* %28), !dbg !66
  %30 = call i8* @sol.ifTrue.anon.(i8* %29), !dbg !66
  %31 = call i8* @sol.Ok.1(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @"()", i64 0, i64 0)), !dbg !67
  ret i8* %0, !dbg !31
}

define i8* @"lib::set_worker.3"(i8* %0, i8* %1, i8* %2) !dbg !68 {
  %4 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @ctx, i64 0, i64 0), i8* getelementptr inbounds ([18 x i8], [18 x i8]* @"Context<SetWorker>", i64 0, i64 0)), !dbg !69
  %5 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([8 x i8], [8 x i8]* @_task_id, i64 0, i64 0), i8* getelementptr inbounds ([6 x i8], [6 x i8]* @String, i64 0, i64 0)), !dbg !69
  %6 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([6 x i8], [6 x i8]* @worker, i64 0, i64 0), i8* getelementptr inbounds ([6 x i8], [6 x i8]* @Pubkey, i64 0, i64 0)), !dbg !69
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([6 x i8], [6 x i8]* @escrow, i64 0, i64 0), i8* getelementptr inbounds ([19 x i8], [19 x i8]* @ctx.accounts.escrow, i64 0, i64 0)), !dbg !71
  %7 = call i8* @"sol.require.!2"(i8* getelementptr inbounds ([35 x i8], [35 x i8]* @"escrow.status==EscrowStatus::Funded", i64 0, i64 0), i8* getelementptr inbounds ([26 x i8], [26 x i8]* @"EscrowError::InvalidStatus", i64 0, i64 0)), !dbg !72
  %8 = call i8* @"sol.require.!2"(i8* getelementptr inbounds ([32 x i8], [32 x i8]* @"escrow.worker==Pubkey::default()", i64 0, i64 0), i8* getelementptr inbounds ([29 x i8], [29 x i8]* @"EscrowError::WorkerAlreadySet", i64 0, i64 0)), !dbg !73
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @escrow.worker, i64 0, i64 0), i8* %2), !dbg !74
  %9 = call i8* @sol.Ok.1(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @"()", i64 0, i64 0)), !dbg !75
  ret i8* %0, !dbg !69
}

define i8* @"lib::release_escrow.anon.1"(i8* %0) !dbg !76 {
  %2 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @parser.error, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @"*i8", i64 0, i64 0)), !dbg !77
  %3 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([18 x i8], [18 x i8]* @ctx.accounts.vault, i64 0, i64 0)), !dbg !79
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @from, i64 0, i64 0), i8* %3), !dbg !80
  %4 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([27 x i8], [27 x i8]* @ctx.accounts.platform_token, i64 0, i64 0)), !dbg !81
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @to, i64 0, i64 0), i8* %4), !dbg !82
  %5 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([19 x i8], [19 x i8]* @ctx.accounts.escrow, i64 0, i64 0)), !dbg !83
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @authority, i64 0, i64 0), i8* %5), !dbg !84
  %6 = call i8* @sol.model.struct.new.Transfer.3(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @from, i64 0, i64 0), i8* getelementptr inbounds ([2 x i8], [2 x i8]* @to, i64 0, i64 0), i8* getelementptr inbounds ([9 x i8], [9 x i8]* @authority, i64 0, i64 0)), !dbg !85
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @transfer_fee, i64 0, i64 0), i8* %6), !dbg !86
  %7 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([26 x i8], [26 x i8]* @ctx.accounts.token_program, i64 0, i64 0)), !dbg !87
  %8 = call i8* @"sol.CpiContext::new_with_signer.3"(i8* %7, i8* getelementptr inbounds ([12 x i8], [12 x i8]* @transfer_fee, i64 0, i64 0), i8* getelementptr inbounds ([12 x i8], [12 x i8]* @signer_seeds, i64 0, i64 0)), !dbg !88
  %9 = call i8* @"sol.token::transfer.2"(i8* %8, i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fee, i64 0, i64 0)), !dbg !89
  ret i8* %0, !dbg !77
}

define i8* @"lib::release_escrow.2"(i8* %0, i8* %1) !dbg !90 {
  %3 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @ctx, i64 0, i64 0), i8* getelementptr inbounds ([22 x i8], [22 x i8]* @"Context<ReleaseEscrow>", i64 0, i64 0)), !dbg !91
  %4 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([8 x i8], [8 x i8]* @_task_id, i64 0, i64 0), i8* getelementptr inbounds ([6 x i8], [6 x i8]* @String, i64 0, i64 0)), !dbg !91
  %5 = call i8* @sol.clone.1(i8* getelementptr inbounds ([26 x i8], [26 x i8]* @ctx.accounts.escrow.status, i64 0, i64 0)), !dbg !93
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @escrow_status, i64 0, i64 0), i8* %5), !dbg !94
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @escrow_amount, i64 0, i64 0), i8* getelementptr inbounds ([26 x i8], [26 x i8]* @ctx.accounts.escrow.amount, i64 0, i64 0)), !dbg !95
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([14 x i8], [14 x i8]* @escrow_fee_bps, i64 0, i64 0), i8* getelementptr inbounds ([27 x i8], [27 x i8]* @ctx.accounts.escrow.fee_bps, i64 0, i64 0)), !dbg !96
  %6 = call i8* @sol.clone.1(i8* getelementptr inbounds ([27 x i8], [27 x i8]* @ctx.accounts.escrow.task_id, i64 0, i64 0)), !dbg !97
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([14 x i8], [14 x i8]* @escrow_task_id, i64 0, i64 0), i8* %6), !dbg !98
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([11 x i8], [11 x i8]* @escrow_bump, i64 0, i64 0), i8* getelementptr inbounds ([24 x i8], [24 x i8]* @ctx.accounts.escrow.bump, i64 0, i64 0)), !dbg !99
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @escrow_worker, i64 0, i64 0), i8* getelementptr inbounds ([26 x i8], [26 x i8]* @ctx.accounts.escrow.worker, i64 0, i64 0)), !dbg !100
  %7 = call i8* @"sol.require.!2"(i8* getelementptr inbounds ([35 x i8], [35 x i8]* @"escrow_status==EscrowStatus::Funded", i64 0, i64 0), i8* getelementptr inbounds ([26 x i8], [26 x i8]* @"EscrowError::InvalidStatus", i64 0, i64 0)), !dbg !101
  %8 = call i8* @"sol.require.!2"(i8* getelementptr inbounds ([32 x i8], [32 x i8]* @"escrow_worker!=Pubkey::default()", i64 0, i64 0), i8* getelementptr inbounds ([25 x i8], [25 x i8]* @"EscrowError::WorkerNotSet", i64 0, i64 0)), !dbg !102
  %9 = call i8* @"sol.require.!2"(i8* getelementptr inbounds ([46 x i8], [46 x i8]* @"ctx.accounts.worker_token.owner==escrow_worker", i64 0, i64 0), i8* getelementptr inbounds ([25 x i8], [25 x i8]* @"EscrowError::Unauthorized", i64 0, i64 0)), !dbg !103
  %10 = call i8* @sol.typecast(i8* getelementptr inbounds ([14 x i8], [14 x i8]* @escrow_fee_bps, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @u64, i64 0, i64 0)), !dbg !104
  %11 = call i8* @sol.checked_mul.2(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @escrow_amount, i64 0, i64 0), i8* %10), !dbg !105
  %12 = call i8* @sol.ok_or.2(i8* %11, i8* getelementptr inbounds ([25 x i8], [25 x i8]* @"EscrowError::MathOverflow", i64 0, i64 0)), !dbg !106
  %13 = call i8* @sol.checked_div.2(i8* %12, i8* getelementptr inbounds ([5 x i8], [5 x i8]* @"10000", i64 0, i64 0)), !dbg !107
  %14 = call i8* @sol.ok_or.2(i8* %13, i8* getelementptr inbounds ([25 x i8], [25 x i8]* @"EscrowError::MathOverflow", i64 0, i64 0)), !dbg !108
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fee, i64 0, i64 0), i8* %14), !dbg !109
  %15 = call i8* @sol.checked_sub.2(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @escrow_amount, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fee, i64 0, i64 0)), !dbg !110
  %16 = call i8* @sol.ok_or.2(i8* %15, i8* getelementptr inbounds ([25 x i8], [25 x i8]* @"EscrowError::MathOverflow", i64 0, i64 0)), !dbg !111
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([6 x i8], [6 x i8]* @payout, i64 0, i64 0), i8* %16), !dbg !112
  %17 = call i8* @sol.as_bytes.1(i8* getelementptr inbounds ([14 x i8], [14 x i8]* @escrow_task_id, i64 0, i64 0)), !dbg !113
  %18 = call i8* @sol.to_vec.1(i8* %17), !dbg !114
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @task_id_bytes, i64 0, i64 0), i8* %18), !dbg !115
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @seeds, i64 0, i64 0), i8* getelementptr inbounds ([60 x i8], [60 x i8]* @"[b\22escrow\22.as_ref(),task_id_bytes.as_slice(),&[escrow_bump]]", i64 0, i64 0)), !dbg !116
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @signer_seeds, i64 0, i64 0), i8* getelementptr inbounds ([12 x i8], [12 x i8]* @"[&seeds[..]]", i64 0, i64 0)), !dbg !117
  %19 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([18 x i8], [18 x i8]* @ctx.accounts.vault, i64 0, i64 0)), !dbg !118
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @from, i64 0, i64 0), i8* %19), !dbg !119
  %20 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([25 x i8], [25 x i8]* @ctx.accounts.worker_token, i64 0, i64 0)), !dbg !120
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @to, i64 0, i64 0), i8* %20), !dbg !121
  %21 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([19 x i8], [19 x i8]* @ctx.accounts.escrow, i64 0, i64 0)), !dbg !122
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @authority, i64 0, i64 0), i8* %21), !dbg !123
  %22 = call i8* @sol.model.struct.new.Transfer.3(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @from, i64 0, i64 0), i8* getelementptr inbounds ([2 x i8], [2 x i8]* @to, i64 0, i64 0), i8* getelementptr inbounds ([9 x i8], [9 x i8]* @authority, i64 0, i64 0)), !dbg !124
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([15 x i8], [15 x i8]* @transfer_payout, i64 0, i64 0), i8* %22), !dbg !125
  %23 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([26 x i8], [26 x i8]* @ctx.accounts.token_program, i64 0, i64 0)), !dbg !126
  %24 = call i8* @"sol.CpiContext::new_with_signer.3"(i8* %23, i8* getelementptr inbounds ([15 x i8], [15 x i8]* @transfer_payout, i64 0, i64 0), i8* getelementptr inbounds ([12 x i8], [12 x i8]* @signer_seeds, i64 0, i64 0)), !dbg !127
  %25 = call i8* @"sol.token::transfer.2"(i8* %24, i8* getelementptr inbounds ([6 x i8], [6 x i8]* @payout, i64 0, i64 0)), !dbg !128
  %26 = call i8* @"sol.>"(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fee, i64 0, i64 0), i8* getelementptr inbounds ([1 x i8], [1 x i8]* @"0", i64 0, i64 0)), !dbg !129
  %27 = call i8* @sol.if(i8* %26), !dbg !130
  %28 = call i8* @"sol.lib::release_escrow.anon.1"(i8* %27), !dbg !131
  %29 = call i8* @sol.ifTrue.anon.(i8* %28), !dbg !131
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([26 x i8], [26 x i8]* @ctx.accounts.escrow.status, i64 0, i64 0), i8* getelementptr inbounds ([22 x i8], [22 x i8]* @"EscrowStatus::Released", i64 0, i64 0)), !dbg !132
  %30 = call i8* @sol.Ok.1(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @"()", i64 0, i64 0)), !dbg !133
  ret i8* %0, !dbg !91
}

define i8* @"lib::refund_escrow.2"(i8* %0, i8* %1) !dbg !134 {
  %3 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @ctx, i64 0, i64 0), i8* getelementptr inbounds ([21 x i8], [21 x i8]* @"Context<RefundEscrow>", i64 0, i64 0)), !dbg !135
  %4 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([8 x i8], [8 x i8]* @_task_id, i64 0, i64 0), i8* getelementptr inbounds ([6 x i8], [6 x i8]* @String, i64 0, i64 0)), !dbg !135
  %5 = call i8* @sol.clone.1(i8* getelementptr inbounds ([26 x i8], [26 x i8]* @ctx.accounts.escrow.status, i64 0, i64 0)), !dbg !137
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @escrow_status, i64 0, i64 0), i8* %5), !dbg !138
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @escrow_amount, i64 0, i64 0), i8* getelementptr inbounds ([26 x i8], [26 x i8]* @ctx.accounts.escrow.amount, i64 0, i64 0)), !dbg !139
  %6 = call i8* @sol.clone.1(i8* getelementptr inbounds ([27 x i8], [27 x i8]* @ctx.accounts.escrow.task_id, i64 0, i64 0)), !dbg !140
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([14 x i8], [14 x i8]* @escrow_task_id, i64 0, i64 0), i8* %6), !dbg !141
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([11 x i8], [11 x i8]* @escrow_bump, i64 0, i64 0), i8* getelementptr inbounds ([24 x i8], [24 x i8]* @ctx.accounts.escrow.bump, i64 0, i64 0)), !dbg !142
  %7 = call i8* @"sol.require.!2"(i8* getelementptr inbounds ([35 x i8], [35 x i8]* @"escrow_status==EscrowStatus::Funded", i64 0, i64 0), i8* getelementptr inbounds ([26 x i8], [26 x i8]* @"EscrowError::InvalidStatus", i64 0, i64 0)), !dbg !143
  %8 = call i8* @sol.as_bytes.1(i8* getelementptr inbounds ([14 x i8], [14 x i8]* @escrow_task_id, i64 0, i64 0)), !dbg !144
  %9 = call i8* @sol.to_vec.1(i8* %8), !dbg !145
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @task_id_bytes, i64 0, i64 0), i8* %9), !dbg !146
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @seeds, i64 0, i64 0), i8* getelementptr inbounds ([60 x i8], [60 x i8]* @"[b\22escrow\22.as_ref(),task_id_bytes.as_slice(),&[escrow_bump]]", i64 0, i64 0)), !dbg !147
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @signer_seeds, i64 0, i64 0), i8* getelementptr inbounds ([12 x i8], [12 x i8]* @"[&seeds[..]]", i64 0, i64 0)), !dbg !148
  %10 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([18 x i8], [18 x i8]* @ctx.accounts.vault, i64 0, i64 0)), !dbg !149
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @from, i64 0, i64 0), i8* %10), !dbg !150
  %11 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([28 x i8], [28 x i8]* @ctx.accounts.publisher_token, i64 0, i64 0)), !dbg !151
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @to, i64 0, i64 0), i8* %11), !dbg !152
  %12 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([19 x i8], [19 x i8]* @ctx.accounts.escrow, i64 0, i64 0)), !dbg !153
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @authority, i64 0, i64 0), i8* %12), !dbg !154
  %13 = call i8* @sol.model.struct.new.Transfer.3(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @from, i64 0, i64 0), i8* getelementptr inbounds ([2 x i8], [2 x i8]* @to, i64 0, i64 0), i8* getelementptr inbounds ([9 x i8], [9 x i8]* @authority, i64 0, i64 0)), !dbg !155
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([15 x i8], [15 x i8]* @transfer_refund, i64 0, i64 0), i8* %13), !dbg !156
  %14 = call i8* @sol.to_account_info.1(i8* getelementptr inbounds ([26 x i8], [26 x i8]* @ctx.accounts.token_program, i64 0, i64 0)), !dbg !157
  %15 = call i8* @"sol.CpiContext::new_with_signer.3"(i8* %14, i8* getelementptr inbounds ([15 x i8], [15 x i8]* @transfer_refund, i64 0, i64 0), i8* getelementptr inbounds ([12 x i8], [12 x i8]* @signer_seeds, i64 0, i64 0)), !dbg !158
  %16 = call i8* @"sol.token::transfer.2"(i8* %15, i8* getelementptr inbounds ([13 x i8], [13 x i8]* @escrow_amount, i64 0, i64 0)), !dbg !159
  call void @sol.model.opaqueAssign(i8* getelementptr inbounds ([26 x i8], [26 x i8]* @ctx.accounts.escrow.status, i64 0, i64 0), i8* getelementptr inbounds ([22 x i8], [22 x i8]* @"EscrowStatus::Refunded", i64 0, i64 0)), !dbg !160
  %17 = call i8* @sol.Ok.1(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @"()", i64 0, i64 0)), !dbg !161
  ret i8* %0, !dbg !135
}

define i8* @sol.model.anchor.program.escrow(i8* %0) !dbg !162 {
  %2 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @parser.error, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @"*i8", i64 0, i64 0)), !dbg !163
  %3 = call i8* @sol.create_escrow.5(i8* getelementptr inbounds ([25 x i8], [25 x i8]* @"ctx:Context<CreateEscrow>", i64 0, i64 0), i8* getelementptr inbounds ([14 x i8], [14 x i8]* @"task_id:String", i64 0, i64 0), i8* getelementptr inbounds ([10 x i8], [10 x i8]* @"amount:u64", i64 0, i64 0), i8* getelementptr inbounds ([15 x i8], [15 x i8]* @"listing_fee:u64", i64 0, i64 0), i8* getelementptr inbounds ([11 x i8], [11 x i8]* @"fee_bps:u16", i64 0, i64 0)), !dbg !165
  %4 = call i8* @sol.set_worker.3(i8* getelementptr inbounds ([22 x i8], [22 x i8]* @"ctx:Context<SetWorker>", i64 0, i64 0), i8* getelementptr inbounds ([15 x i8], [15 x i8]* @"_task_id:String", i64 0, i64 0), i8* getelementptr inbounds ([13 x i8], [13 x i8]* @"worker:Pubkey", i64 0, i64 0)), !dbg !166
  %5 = call i8* @sol.release_escrow.2(i8* getelementptr inbounds ([26 x i8], [26 x i8]* @"ctx:Context<ReleaseEscrow>", i64 0, i64 0), i8* getelementptr inbounds ([15 x i8], [15 x i8]* @"_task_id:String", i64 0, i64 0)), !dbg !167
  %6 = call i8* @sol.refund_escrow.2(i8* getelementptr inbounds ([25 x i8], [25 x i8]* @"ctx:Context<RefundEscrow>", i64 0, i64 0), i8* getelementptr inbounds ([15 x i8], [15 x i8]* @"_task_id:String", i64 0, i64 0)), !dbg !168
  ret i8* %0, !dbg !163
}

define i8* @main(i8* %0) !dbg !169 {
  %2 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @parser.error, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @"*i8", i64 0, i64 0)), !dbg !170
  %3 = call i8* @sol.model.anchor.program.escrow(i8* getelementptr inbounds ([10 x i8], [10 x i8]* @program_id, i64 0, i64 0)), !dbg !170
  ret i8* %0, !dbg !170
}

define i8* @sol.model.struct.anchor.Escrow(i8* %0) !dbg !172 {
  %2 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @parser.error, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @"*i8", i64 0, i64 0)), !dbg !173
  %3 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @publisher, i64 0, i64 0), i8* getelementptr inbounds ([6 x i8], [6 x i8]* @Pubkey, i64 0, i64 0)), !dbg !175
  %4 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([18 x i8], [18 x i8]* @platform_authority, i64 0, i64 0), i8* getelementptr inbounds ([6 x i8], [6 x i8]* @Pubkey, i64 0, i64 0)), !dbg !176
  %5 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @usdc_mint, i64 0, i64 0), i8* getelementptr inbounds ([6 x i8], [6 x i8]* @Pubkey, i64 0, i64 0)), !dbg !177
  %6 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([6 x i8], [6 x i8]* @amount, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @u64, i64 0, i64 0)), !dbg !178
  %7 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([11 x i8], [11 x i8]* @listing_fee, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @u64, i64 0, i64 0)), !dbg !179
  %8 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([7 x i8], [7 x i8]* @fee_bps, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @u16, i64 0, i64 0)), !dbg !180
  %9 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([7 x i8], [7 x i8]* @task_id, i64 0, i64 0), i8* getelementptr inbounds ([6 x i8], [6 x i8]* @String, i64 0, i64 0)), !dbg !181
  %10 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([6 x i8], [6 x i8]* @status, i64 0, i64 0), i8* getelementptr inbounds ([12 x i8], [12 x i8]* @EscrowStatus, i64 0, i64 0)), !dbg !182
  %11 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([6 x i8], [6 x i8]* @worker, i64 0, i64 0), i8* getelementptr inbounds ([6 x i8], [6 x i8]* @Pubkey, i64 0, i64 0)), !dbg !183
  %12 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @bump, i64 0, i64 0), i8* getelementptr inbounds ([2 x i8], [2 x i8]* @u8, i64 0, i64 0)), !dbg !184
  ret i8* %0, !dbg !173
}

define i8* @sol.model.struct.anchor.CreateEscrow(i8* %0) !dbg !185 {
  %2 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @parser.error, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @"*i8", i64 0, i64 0)), !dbg !186
  %3 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([87 x i8], [87 x i8]* @"init,payer=publisher,space=8+Escrow::MAX_SIZE,seeds=[b\22escrow\22,task_id.as_bytes()],bump", i64 0, i64 0)), !dbg !188
  %4 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([6 x i8], [6 x i8]* @escrow, i64 0, i64 0), i8* getelementptr inbounds ([21 x i8], [21 x i8]* @"Account<'info,Escrow>", i64 0, i64 0)), !dbg !189
  %5 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @mut, i64 0, i64 0)), !dbg !190
  %6 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @publisher, i64 0, i64 0), i8* getelementptr inbounds ([13 x i8], [13 x i8]* @"Signer<'info>", i64 0, i64 0)), !dbg !191
  %7 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([18 x i8], [18 x i8]* @platform_authority, i64 0, i64 0), i8* getelementptr inbounds ([18 x i8], [18 x i8]* @"AccountInfo<'info>", i64 0, i64 0)), !dbg !192
  %8 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @usdc_mint, i64 0, i64 0), i8* getelementptr inbounds ([19 x i8], [19 x i8]* @"Account<'info,Mint>", i64 0, i64 0)), !dbg !193
  %9 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([53 x i8], [53 x i8]* @"mut,token::mint=usdc_mint,token::authority=publisher,", i64 0, i64 0)), !dbg !194
  %10 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([15 x i8], [15 x i8]* @publisher_token, i64 0, i64 0), i8* getelementptr inbounds ([27 x i8], [27 x i8]* @"Account<'info,TokenAccount>", i64 0, i64 0)), !dbg !195
  %11 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([26 x i8], [26 x i8]* @"mut,token::mint=usdc_mint,", i64 0, i64 0)), !dbg !196
  %12 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @vault, i64 0, i64 0), i8* getelementptr inbounds ([27 x i8], [27 x i8]* @"Account<'info,TokenAccount>", i64 0, i64 0)), !dbg !197
  %13 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([26 x i8], [26 x i8]* @"mut,token::mint=usdc_mint,", i64 0, i64 0)), !dbg !198
  %14 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([14 x i8], [14 x i8]* @platform_token, i64 0, i64 0), i8* getelementptr inbounds ([27 x i8], [27 x i8]* @"Account<'info,TokenAccount>", i64 0, i64 0)), !dbg !199
  %15 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @token_program, i64 0, i64 0), i8* getelementptr inbounds ([20 x i8], [20 x i8]* @"Program<'info,Token>", i64 0, i64 0)), !dbg !200
  %16 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([14 x i8], [14 x i8]* @system_program, i64 0, i64 0), i8* getelementptr inbounds ([21 x i8], [21 x i8]* @"Program<'info,System>", i64 0, i64 0)), !dbg !201
  ret i8* %0, !dbg !186
}

define i8* @sol.model.struct.anchor.SetWorker(i8* %0) !dbg !202 {
  %2 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @parser.error, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @"*i8", i64 0, i64 0)), !dbg !203
  %3 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([58 x i8], [58 x i8]* @"mut,seeds=[b\22escrow\22,_task_id.as_bytes()],bump=escrow.bump", i64 0, i64 0)), !dbg !205
  %4 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([6 x i8], [6 x i8]* @escrow, i64 0, i64 0), i8* getelementptr inbounds ([21 x i8], [21 x i8]* @"Account<'info,Escrow>", i64 0, i64 0)), !dbg !206
  %5 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([88 x i8], [88 x i8]* @"constraint=platform_authority.key()==escrow.platform_authority@EscrowError::Unauthorized", i64 0, i64 0)), !dbg !207
  %6 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([18 x i8], [18 x i8]* @platform_authority, i64 0, i64 0), i8* getelementptr inbounds ([13 x i8], [13 x i8]* @"Signer<'info>", i64 0, i64 0)), !dbg !208
  ret i8* %0, !dbg !203
}

define i8* @sol.model.struct.anchor.ReleaseEscrow(i8* %0) !dbg !209 {
  %2 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @parser.error, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @"*i8", i64 0, i64 0)), !dbg !210
  %3 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([58 x i8], [58 x i8]* @"mut,seeds=[b\22escrow\22,_task_id.as_bytes()],bump=escrow.bump", i64 0, i64 0)), !dbg !212
  %4 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([6 x i8], [6 x i8]* @escrow, i64 0, i64 0), i8* getelementptr inbounds ([21 x i8], [21 x i8]* @"Account<'info,Escrow>", i64 0, i64 0)), !dbg !213
  %5 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([88 x i8], [88 x i8]* @"constraint=platform_authority.key()==escrow.platform_authority@EscrowError::Unauthorized", i64 0, i64 0)), !dbg !214
  %6 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([18 x i8], [18 x i8]* @platform_authority, i64 0, i64 0), i8* getelementptr inbounds ([13 x i8], [13 x i8]* @"Signer<'info>", i64 0, i64 0)), !dbg !215
  %7 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([69 x i8], [69 x i8]* @"constraint=usdc_mint.key()==escrow.usdc_mint@EscrowError::InvalidMint", i64 0, i64 0)), !dbg !216
  %8 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @usdc_mint, i64 0, i64 0), i8* getelementptr inbounds ([19 x i8], [19 x i8]* @"Account<'info,Mint>", i64 0, i64 0)), !dbg !217
  %9 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([50 x i8], [50 x i8]* @"mut,token::mint=usdc_mint,token::authority=escrow,", i64 0, i64 0)), !dbg !218
  %10 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @vault, i64 0, i64 0), i8* getelementptr inbounds ([27 x i8], [27 x i8]* @"Account<'info,TokenAccount>", i64 0, i64 0)), !dbg !219
  %11 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([26 x i8], [26 x i8]* @"mut,token::mint=usdc_mint,", i64 0, i64 0)), !dbg !220
  %12 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @worker_token, i64 0, i64 0), i8* getelementptr inbounds ([27 x i8], [27 x i8]* @"Account<'info,TokenAccount>", i64 0, i64 0)), !dbg !221
  %13 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([69 x i8], [69 x i8]* @"mut,token::mint=usdc_mint,token::authority=escrow.platform_authority,", i64 0, i64 0)), !dbg !222
  %14 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([14 x i8], [14 x i8]* @platform_token, i64 0, i64 0), i8* getelementptr inbounds ([27 x i8], [27 x i8]* @"Account<'info,TokenAccount>", i64 0, i64 0)), !dbg !223
  %15 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @token_program, i64 0, i64 0), i8* getelementptr inbounds ([20 x i8], [20 x i8]* @"Program<'info,Token>", i64 0, i64 0)), !dbg !224
  ret i8* %0, !dbg !210
}

define i8* @sol.model.struct.anchor.RefundEscrow(i8* %0) !dbg !225 {
  %2 = call i8* @sol.model.funcArg(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @parser.error, i64 0, i64 0), i8* getelementptr inbounds ([3 x i8], [3 x i8]* @"*i8", i64 0, i64 0)), !dbg !226
  %3 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([58 x i8], [58 x i8]* @"mut,seeds=[b\22escrow\22,_task_id.as_bytes()],bump=escrow.bump", i64 0, i64 0)), !dbg !228
  %4 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([6 x i8], [6 x i8]* @escrow, i64 0, i64 0), i8* getelementptr inbounds ([21 x i8], [21 x i8]* @"Account<'info,Escrow>", i64 0, i64 0)), !dbg !229
  %5 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([88 x i8], [88 x i8]* @"constraint=platform_authority.key()==escrow.platform_authority@EscrowError::Unauthorized", i64 0, i64 0)), !dbg !230
  %6 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([18 x i8], [18 x i8]* @platform_authority, i64 0, i64 0), i8* getelementptr inbounds ([13 x i8], [13 x i8]* @"Signer<'info>", i64 0, i64 0)), !dbg !231
  %7 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([69 x i8], [69 x i8]* @"constraint=usdc_mint.key()==escrow.usdc_mint@EscrowError::InvalidMint", i64 0, i64 0)), !dbg !232
  %8 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @usdc_mint, i64 0, i64 0), i8* getelementptr inbounds ([19 x i8], [19 x i8]* @"Account<'info,Mint>", i64 0, i64 0)), !dbg !233
  %9 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([50 x i8], [50 x i8]* @"mut,token::mint=usdc_mint,token::authority=escrow,", i64 0, i64 0)), !dbg !234
  %10 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @vault, i64 0, i64 0), i8* getelementptr inbounds ([27 x i8], [27 x i8]* @"Account<'info,TokenAccount>", i64 0, i64 0)), !dbg !235
  %11 = call i8* @sol.model.struct.constraint(i8* getelementptr inbounds ([60 x i8], [60 x i8]* @"mut,token::mint=usdc_mint,token::authority=escrow.publisher,", i64 0, i64 0)), !dbg !236
  %12 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([15 x i8], [15 x i8]* @publisher_token, i64 0, i64 0), i8* getelementptr inbounds ([27 x i8], [27 x i8]* @"Account<'info,TokenAccount>", i64 0, i64 0)), !dbg !237
  %13 = call i8* @sol.model.struct.field(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @token_program, i64 0, i64 0), i8* getelementptr inbounds ([20 x i8], [20 x i8]* @"Program<'info,Token>", i64 0, i64 0)), !dbg !238
  ret i8* %0, !dbg !226
}

!llvm.dbg.cu = !{!0}
!llvm.module.flags = !{!2}

!0 = distinct !DICompileUnit(language: DW_LANG_C, file: !1, producer: "mlir", isOptimized: true, runtimeVersion: 0, emissionKind: FullDebug)
!1 = !DIFile(filename: "LLVMDialectModule", directory: "/")
!2 = !{i32 2, !"Debug Info Version", i32 3}
!3 = distinct !DISubprogram(name: "sol.model.cargo.toml", linkageName: "sol.model.cargo.toml", scope: null, file: !4, type: !5, spFlags: DISPFlagDefinition | DISPFlagOptimized, unit: !0, retainedNodes: !6)
!4 = !DIFile(filename: "Cargo.toml", directory: "/home/qmt/project/aglabor/programs/escrow")
!5 = !DISubroutineType(types: !6)
!6 = !{}
!7 = !DILocation(line: 0, scope: !8)
!8 = !DILexicalBlockFile(scope: !3, file: !4, discriminator: 0)
!9 = distinct !DISubprogram(name: "sol.model.declare_id.address", linkageName: "sol.model.declare_id.address", scope: null, file: !4, type: !5, spFlags: DISPFlagDefinition | DISPFlagOptimized, unit: !0, retainedNodes: !6)
!10 = !DILocation(line: 0, scope: !11)
!11 = !DILexicalBlockFile(scope: !9, file: !12, discriminator: 0)
!12 = !DIFile(filename: "lib.rs", directory: "/home/qmt/project/aglabor/programs/escrow")
!13 = !DILocation(line: 0, scope: !14)
!14 = !DILexicalBlockFile(scope: !9, file: !4, discriminator: 0)
!15 = distinct !DISubprogram(name: "lib::create_escrow.anon.1", linkageName: "lib::create_escrow.anon.1", scope: null, file: !16, line: 48, type: !5, scopeLine: 48, spFlags: DISPFlagDefinition | DISPFlagOptimized, unit: !0, retainedNodes: !6)
!16 = !DIFile(filename: "src/lib.rs", directory: "/home/qmt/project/aglabor/programs/escrow")
!17 = !DILocation(line: 48, column: 27, scope: !18)
!18 = !DILexicalBlockFile(scope: !15, file: !16, discriminator: 0)
!19 = !DILocation(line: 50, column: 51, scope: !18)
!20 = !DILocation(line: 50, column: 16, scope: !18)
!21 = !DILocation(line: 51, column: 48, scope: !18)
!22 = !DILocation(line: 51, column: 16, scope: !18)
!23 = !DILocation(line: 52, column: 50, scope: !18)
!24 = !DILocation(line: 52, column: 16, scope: !18)
!25 = !DILocation(line: 49, column: 31, scope: !18)
!26 = !DILocation(line: 49, column: 12, scope: !18)
!27 = !DILocation(line: 55, column: 59, scope: !18)
!28 = !DILocation(line: 55, column: 16, scope: !18)
!29 = !DILocation(line: 54, column: 12, scope: !18)
!30 = distinct !DISubprogram(name: "lib::create_escrow.5", linkageName: "lib::create_escrow.5", scope: null, file: !16, line: 10, type: !5, scopeLine: 10, spFlags: DISPFlagDefinition | DISPFlagOptimized, unit: !0, retainedNodes: !6)
!31 = !DILocation(line: 10, column: 8, scope: !32)
!32 = !DILexicalBlockFile(scope: !30, file: !16, discriminator: 0)
!33 = !DILocation(line: 17, column: 8, scope: !32)
!34 = !DILocation(line: 18, column: 8, scope: !32)
!35 = !DILocation(line: 20, column: 8, scope: !32)
!36 = !DILocation(line: 22, column: 8, scope: !32)
!37 = !DILocation(line: 23, column: 50, scope: !32)
!38 = !DILocation(line: 23, column: 8, scope: !32)
!39 = !DILocation(line: 24, column: 68, scope: !32)
!40 = !DILocation(line: 24, column: 8, scope: !32)
!41 = !DILocation(line: 26, column: 50, scope: !32)
!42 = !DILocation(line: 26, column: 8, scope: !32)
!43 = !DILocation(line: 27, column: 24, scope: !32)
!44 = !DILocation(line: 27, column: 8, scope: !32)
!45 = !DILocation(line: 28, column: 8, scope: !32)
!46 = !DILocation(line: 29, column: 8, scope: !32)
!47 = !DILocation(line: 30, column: 8, scope: !32)
!48 = !DILocation(line: 31, column: 8, scope: !32)
!49 = !DILocation(line: 33, column: 24, scope: !32)
!50 = !DILocation(line: 33, column: 8, scope: !32)
!51 = !DILocation(line: 34, column: 8, scope: !32)
!52 = !DILocation(line: 38, column: 47, scope: !32)
!53 = !DILocation(line: 38, column: 12, scope: !32)
!54 = !DILocation(line: 39, column: 35, scope: !32)
!55 = !DILocation(line: 39, column: 12, scope: !32)
!56 = !DILocation(line: 40, column: 46, scope: !32)
!57 = !DILocation(line: 40, column: 12, scope: !32)
!58 = !DILocation(line: 37, column: 32, scope: !32)
!59 = !DILocation(line: 37, column: 8, scope: !32)
!60 = !DILocation(line: 43, column: 55, scope: !32)
!61 = !DILocation(line: 43, column: 12, scope: !32)
!62 = !DILocation(line: 44, column: 12, scope: !32)
!63 = !DILocation(line: 42, column: 8, scope: !32)
!64 = !DILocation(line: 48, column: 11, scope: !32)
!65 = !DILocation(line: 48, column: 8, scope: !32)
!66 = !DILocation(line: 48, column: 27, scope: !32)
!67 = !DILocation(line: 60, column: 8, scope: !32)
!68 = distinct !DISubprogram(name: "lib::set_worker.3", linkageName: "lib::set_worker.3", scope: null, file: !16, line: 64, type: !5, scopeLine: 64, spFlags: DISPFlagDefinition | DISPFlagOptimized, unit: !0, retainedNodes: !6)
!69 = !DILocation(line: 64, column: 8, scope: !70)
!70 = !DILexicalBlockFile(scope: !68, file: !16, discriminator: 0)
!71 = !DILocation(line: 65, column: 8, scope: !70)
!72 = !DILocation(line: 66, column: 8, scope: !70)
!73 = !DILocation(line: 67, column: 8, scope: !70)
!74 = !DILocation(line: 68, column: 8, scope: !70)
!75 = !DILocation(line: 69, column: 8, scope: !70)
!76 = distinct !DISubprogram(name: "lib::release_escrow.anon.1", linkageName: "lib::release_escrow.anon.1", scope: null, file: !16, line: 120, type: !5, scopeLine: 120, spFlags: DISPFlagDefinition | DISPFlagOptimized, unit: !0, retainedNodes: !6)
!77 = !DILocation(line: 120, column: 19, scope: !78)
!78 = !DILexicalBlockFile(scope: !76, file: !16, discriminator: 0)
!79 = !DILocation(line: 122, column: 41, scope: !78)
!80 = !DILocation(line: 122, column: 16, scope: !78)
!81 = !DILocation(line: 123, column: 48, scope: !78)
!82 = !DILocation(line: 123, column: 16, scope: !78)
!83 = !DILocation(line: 124, column: 47, scope: !78)
!84 = !DILocation(line: 124, column: 16, scope: !78)
!85 = !DILocation(line: 121, column: 31, scope: !78)
!86 = !DILocation(line: 121, column: 12, scope: !78)
!87 = !DILocation(line: 128, column: 47, scope: !78)
!88 = !DILocation(line: 127, column: 16, scope: !78)
!89 = !DILocation(line: 126, column: 12, scope: !78)
!90 = distinct !DISubprogram(name: "lib::release_escrow.2", linkageName: "lib::release_escrow.2", scope: null, file: !16, line: 72, type: !5, scopeLine: 72, spFlags: DISPFlagDefinition | DISPFlagOptimized, unit: !0, retainedNodes: !6)
!91 = !DILocation(line: 72, column: 8, scope: !92)
!92 = !DILexicalBlockFile(scope: !90, file: !16, discriminator: 0)
!93 = !DILocation(line: 74, column: 55, scope: !92)
!94 = !DILocation(line: 74, column: 8, scope: !92)
!95 = !DILocation(line: 75, column: 8, scope: !92)
!96 = !DILocation(line: 76, column: 8, scope: !92)
!97 = !DILocation(line: 77, column: 57, scope: !92)
!98 = !DILocation(line: 77, column: 8, scope: !92)
!99 = !DILocation(line: 78, column: 8, scope: !92)
!100 = !DILocation(line: 79, column: 8, scope: !92)
!101 = !DILocation(line: 81, column: 8, scope: !92)
!102 = !DILocation(line: 84, column: 8, scope: !92)
!103 = !DILocation(line: 85, column: 8, scope: !92)
!104 = !DILocation(line: 92, column: 25, scope: !92)
!105 = !DILocation(line: 92, column: 13, scope: !92)
!106 = !DILocation(line: 93, column: 13, scope: !92)
!107 = !DILocation(line: 94, column: 13, scope: !92)
!108 = !DILocation(line: 95, column: 13, scope: !92)
!109 = !DILocation(line: 91, column: 8, scope: !92)
!110 = !DILocation(line: 97, column: 13, scope: !92)
!111 = !DILocation(line: 98, column: 13, scope: !92)
!112 = !DILocation(line: 96, column: 8, scope: !92)
!113 = !DILocation(line: 100, column: 43, scope: !92)
!114 = !DILocation(line: 100, column: 54, scope: !92)
!115 = !DILocation(line: 100, column: 8, scope: !92)
!116 = !DILocation(line: 101, column: 8, scope: !92)
!117 = !DILocation(line: 102, column: 8, scope: !92)
!118 = !DILocation(line: 106, column: 37, scope: !92)
!119 = !DILocation(line: 106, column: 12, scope: !92)
!120 = !DILocation(line: 107, column: 42, scope: !92)
!121 = !DILocation(line: 107, column: 12, scope: !92)
!122 = !DILocation(line: 108, column: 43, scope: !92)
!123 = !DILocation(line: 108, column: 12, scope: !92)
!124 = !DILocation(line: 105, column: 30, scope: !92)
!125 = !DILocation(line: 105, column: 8, scope: !92)
!126 = !DILocation(line: 112, column: 43, scope: !92)
!127 = !DILocation(line: 111, column: 12, scope: !92)
!128 = !DILocation(line: 110, column: 8, scope: !92)
!129 = !DILocation(line: 120, column: 11, scope: !92)
!130 = !DILocation(line: 120, column: 8, scope: !92)
!131 = !DILocation(line: 120, column: 19, scope: !92)
!132 = !DILocation(line: 136, column: 8, scope: !92)
!133 = !DILocation(line: 137, column: 8, scope: !92)
!134 = distinct !DISubprogram(name: "lib::refund_escrow.2", linkageName: "lib::refund_escrow.2", scope: null, file: !16, line: 140, type: !5, scopeLine: 140, spFlags: DISPFlagDefinition | DISPFlagOptimized, unit: !0, retainedNodes: !6)
!135 = !DILocation(line: 140, column: 8, scope: !136)
!136 = !DILexicalBlockFile(scope: !134, file: !16, discriminator: 0)
!137 = !DILocation(line: 142, column: 55, scope: !136)
!138 = !DILocation(line: 142, column: 8, scope: !136)
!139 = !DILocation(line: 143, column: 8, scope: !136)
!140 = !DILocation(line: 144, column: 57, scope: !136)
!141 = !DILocation(line: 144, column: 8, scope: !136)
!142 = !DILocation(line: 145, column: 8, scope: !136)
!143 = !DILocation(line: 147, column: 8, scope: !136)
!144 = !DILocation(line: 149, column: 43, scope: !136)
!145 = !DILocation(line: 149, column: 54, scope: !136)
!146 = !DILocation(line: 149, column: 8, scope: !136)
!147 = !DILocation(line: 150, column: 8, scope: !136)
!148 = !DILocation(line: 151, column: 8, scope: !136)
!149 = !DILocation(line: 154, column: 37, scope: !136)
!150 = !DILocation(line: 154, column: 12, scope: !136)
!151 = !DILocation(line: 155, column: 45, scope: !136)
!152 = !DILocation(line: 155, column: 12, scope: !136)
!153 = !DILocation(line: 156, column: 43, scope: !136)
!154 = !DILocation(line: 156, column: 12, scope: !136)
!155 = !DILocation(line: 153, column: 30, scope: !136)
!156 = !DILocation(line: 153, column: 8, scope: !136)
!157 = !DILocation(line: 160, column: 43, scope: !136)
!158 = !DILocation(line: 159, column: 12, scope: !136)
!159 = !DILocation(line: 158, column: 8, scope: !136)
!160 = !DILocation(line: 167, column: 8, scope: !136)
!161 = !DILocation(line: 168, column: 8, scope: !136)
!162 = distinct !DISubprogram(name: "sol.model.anchor.program.escrow", linkageName: "sol.model.anchor.program.escrow", scope: null, file: !16, line: 6, type: !5, scopeLine: 6, spFlags: DISPFlagDefinition | DISPFlagOptimized, unit: !0, retainedNodes: !6)
!163 = !DILocation(line: 6, scope: !164)
!164 = !DILexicalBlockFile(scope: !162, file: !16, discriminator: 0)
!165 = !DILocation(line: 10, column: 4, scope: !164)
!166 = !DILocation(line: 64, column: 4, scope: !164)
!167 = !DILocation(line: 72, column: 4, scope: !164)
!168 = !DILocation(line: 140, column: 4, scope: !164)
!169 = distinct !DISubprogram(name: "main", linkageName: "main", scope: null, file: !16, line: 6, type: !5, scopeLine: 6, spFlags: DISPFlagDefinition | DISPFlagOptimized, unit: !0, retainedNodes: !6)
!170 = !DILocation(line: 6, scope: !171)
!171 = !DILexicalBlockFile(scope: !169, file: !16, discriminator: 0)
!172 = distinct !DISubprogram(name: "sol.model.struct.anchor.Escrow", linkageName: "sol.model.struct.anchor.Escrow", scope: null, file: !16, line: 182, type: !5, scopeLine: 182, spFlags: DISPFlagDefinition | DISPFlagOptimized, unit: !0, retainedNodes: !6)
!173 = !DILocation(line: 182, column: 4, scope: !174)
!174 = !DILexicalBlockFile(scope: !172, file: !16, discriminator: 0)
!175 = !DILocation(line: 183, column: 8, scope: !174)
!176 = !DILocation(line: 184, column: 8, scope: !174)
!177 = !DILocation(line: 186, column: 8, scope: !174)
!178 = !DILocation(line: 187, column: 8, scope: !174)
!179 = !DILocation(line: 188, column: 8, scope: !174)
!180 = !DILocation(line: 189, column: 8, scope: !174)
!181 = !DILocation(line: 190, column: 8, scope: !174)
!182 = !DILocation(line: 191, column: 8, scope: !174)
!183 = !DILocation(line: 193, column: 8, scope: !174)
!184 = !DILocation(line: 194, column: 8, scope: !174)
!185 = distinct !DISubprogram(name: "sol.model.struct.anchor.CreateEscrow", linkageName: "sol.model.struct.anchor.CreateEscrow", scope: null, file: !16, line: 205, type: !5, scopeLine: 205, spFlags: DISPFlagDefinition | DISPFlagOptimized, unit: !0, retainedNodes: !6)
!186 = !DILocation(line: 205, column: 4, scope: !187)
!187 = !DILexicalBlockFile(scope: !185, file: !16, discriminator: 0)
!188 = !DILocation(line: 206, column: 6, scope: !187)
!189 = !DILocation(line: 213, column: 8, scope: !187)
!190 = !DILocation(line: 214, column: 6, scope: !187)
!191 = !DILocation(line: 215, column: 8, scope: !187)
!192 = !DILocation(line: 217, column: 8, scope: !187)
!193 = !DILocation(line: 219, column: 8, scope: !187)
!194 = !DILocation(line: 220, column: 6, scope: !187)
!195 = !DILocation(line: 225, column: 8, scope: !187)
!196 = !DILocation(line: 226, column: 6, scope: !187)
!197 = !DILocation(line: 230, column: 8, scope: !187)
!198 = !DILocation(line: 231, column: 6, scope: !187)
!199 = !DILocation(line: 235, column: 8, scope: !187)
!200 = !DILocation(line: 236, column: 8, scope: !187)
!201 = !DILocation(line: 237, column: 8, scope: !187)
!202 = distinct !DISubprogram(name: "sol.model.struct.anchor.SetWorker", linkageName: "sol.model.struct.anchor.SetWorker", scope: null, file: !16, line: 243, type: !5, scopeLine: 243, spFlags: DISPFlagDefinition | DISPFlagOptimized, unit: !0, retainedNodes: !6)
!203 = !DILocation(line: 243, column: 4, scope: !204)
!204 = !DILexicalBlockFile(scope: !202, file: !16, discriminator: 0)
!205 = !DILocation(line: 244, column: 6, scope: !204)
!206 = !DILocation(line: 249, column: 8, scope: !204)
!207 = !DILocation(line: 250, column: 6, scope: !204)
!208 = !DILocation(line: 253, column: 8, scope: !204)
!209 = distinct !DISubprogram(name: "sol.model.struct.anchor.ReleaseEscrow", linkageName: "sol.model.struct.anchor.ReleaseEscrow", scope: null, file: !16, line: 258, type: !5, scopeLine: 258, spFlags: DISPFlagDefinition | DISPFlagOptimized, unit: !0, retainedNodes: !6)
!210 = !DILocation(line: 258, column: 4, scope: !211)
!211 = !DILexicalBlockFile(scope: !209, file: !16, discriminator: 0)
!212 = !DILocation(line: 259, column: 6, scope: !211)
!213 = !DILocation(line: 264, column: 8, scope: !211)
!214 = !DILocation(line: 265, column: 6, scope: !211)
!215 = !DILocation(line: 268, column: 8, scope: !211)
!216 = !DILocation(line: 270, column: 6, scope: !211)
!217 = !DILocation(line: 273, column: 8, scope: !211)
!218 = !DILocation(line: 274, column: 6, scope: !211)
!219 = !DILocation(line: 279, column: 8, scope: !211)
!220 = !DILocation(line: 280, column: 6, scope: !211)
!221 = !DILocation(line: 284, column: 8, scope: !211)
!222 = !DILocation(line: 285, column: 6, scope: !211)
!223 = !DILocation(line: 290, column: 8, scope: !211)
!224 = !DILocation(line: 291, column: 8, scope: !211)
!225 = distinct !DISubprogram(name: "sol.model.struct.anchor.RefundEscrow", linkageName: "sol.model.struct.anchor.RefundEscrow", scope: null, file: !16, line: 296, type: !5, scopeLine: 296, spFlags: DISPFlagDefinition | DISPFlagOptimized, unit: !0, retainedNodes: !6)
!226 = !DILocation(line: 296, column: 4, scope: !227)
!227 = !DILexicalBlockFile(scope: !225, file: !16, discriminator: 0)
!228 = !DILocation(line: 297, column: 6, scope: !227)
!229 = !DILocation(line: 302, column: 8, scope: !227)
!230 = !DILocation(line: 303, column: 6, scope: !227)
!231 = !DILocation(line: 306, column: 8, scope: !227)
!232 = !DILocation(line: 308, column: 6, scope: !227)
!233 = !DILocation(line: 311, column: 8, scope: !227)
!234 = !DILocation(line: 312, column: 6, scope: !227)
!235 = !DILocation(line: 317, column: 8, scope: !227)
!236 = !DILocation(line: 318, column: 6, scope: !227)
!237 = !DILocation(line: 323, column: 8, scope: !227)
!238 = !DILocation(line: 324, column: 8, scope: !227)
