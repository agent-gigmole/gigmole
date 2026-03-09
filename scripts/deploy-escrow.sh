#!/bin/bash
set -e

# Deploy the AgLabor Escrow Program to Solana devnet
# Usage: ./scripts/deploy-escrow.sh

PROGRAM_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROGRAM_SO="$PROGRAM_DIR/target/deploy/escrow.so"
PROGRAM_KEYPAIR="$PROGRAM_DIR/target/deploy/escrow-keypair.json"

echo "=== AgLabor Escrow Program Deployment ==="
echo ""

# Ensure we're on devnet
solana config set --url devnet

# Check wallet balance
BALANCE=$(solana balance | awk '{print $1}')
echo "Current wallet balance: $BALANCE SOL"

# Need ~1.8 SOL for deploying a 250KB program
NEEDED="2"
if (( $(echo "$BALANCE < $NEEDED" | bc -l) )); then
    echo "Insufficient balance. Need at least $NEEDED SOL."
    echo "Requesting airdrop..."
    solana airdrop 2 || {
        echo ""
        echo "Airdrop failed. Please fund your wallet manually:"
        echo "  Wallet: $(solana address)"
        echo "  Visit: https://faucet.solana.com"
        echo ""
        echo "After funding, re-run this script."
        exit 1
    }
fi

# Build if needed
if [ ! -f "$PROGRAM_SO" ]; then
    echo "Building program..."
    cd "$PROGRAM_DIR"
    anchor build
fi

echo ""
echo "Deploying program..."
solana program deploy "$PROGRAM_SO" \
    --program-id "$PROGRAM_KEYPAIR" \
    --url devnet

PROGRAM_ID=$(solana address -k "$PROGRAM_KEYPAIR")
echo ""
echo "=== Deployment Complete ==="
echo "Program ID: $PROGRAM_ID"
echo ""
echo "Next steps:"
echo "  1. Update .env:  SOLANA_ESCROW_PROGRAM_ID=$PROGRAM_ID"
echo "  2. Update Vercel: vercel env add SOLANA_ESCROW_PROGRAM_ID production <<< '$PROGRAM_ID'"
