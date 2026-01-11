# Generate 200 Transactions Script

This script generates 200 transactions/interactions with the deployed MatchManager contract on Base mainnet.

## What it does

1. **Creates 40 PvC matches** (40 transactions)
   - Each match auto-starts with AI as opponent
   - No staking required (uses address(0) for token)

2. **Submits 4 moves per match** (160 transactions)
   - Each match gets 4 player moves
   - AI moves automatically after each player move (handled by contract)

**Total: 200 transactions**

## Prerequisites

1. Set up your `.env` file with:
   ```bash
   PRIVATE_KEY=your_private_key_here
   BASE_MAINNET_RPC=https://mainnet.base.org
   ```

2. Ensure your wallet has enough ETH on Base mainnet for gas fees
   - Estimated: ~0.0005 ETH for 200 transactions

## Usage

### Dry run (simulate without broadcasting)

```bash
cd contract
forge script script/Generate40Tx.s.sol:Generate40Tx \
  --rpc-url $BASE_MAINNET_RPC \
  --chain-id 8453
```

### Execute (broadcast transactions)

```bash
cd contract
source .env
export BASE_MAINNET_RPC="${BASE_MAINNET_RPC:-https://mainnet.base.org}"

forge script script/Generate40Tx.s.sol:Generate40Tx \
  --rpc-url "$BASE_MAINNET_RPC" \
  --broadcast \
  --chain-id 8453 \
  -vvv
```

### With gas estimation

```bash
forge script script/Generate40Tx.s.sol:Generate40Tx \
  --rpc-url "$BASE_MAINNET_RPC" \
  --broadcast \
  --chain-id 8453 \
  --slow \
  -vvv
```

## Output

The script will:
- Print each match creation
- Print move submissions
- Show total transaction count
- Save transaction details to `broadcast/Generate40Tx.s.sol/8453/run-latest.json`

## Customization

To modify the script:

1. **Change number of matches**: Modify `uint256 numMatches = 40;` (currently 40)
2. **Change moves per match**: Modify the inner loop `for (uint256 j = 0; j < 4; j++)`
3. **Add different moves**: Add more `Move` structs to the `moves` array in `setUp()`
4. **Change match type**: Switch from `GameMode.PvC` to `GameMode.PvP` (requires staking setup)

**To generate different transaction counts:**
- 50 transactions: `numMatches = 10` (10 matches × 4 moves = 10 + 40 = 50)
- 100 transactions: `numMatches = 20` (20 matches × 4 moves = 20 + 80 = 100)
- 200 transactions: `numMatches = 40` (40 matches × 4 moves = 40 + 160 = 200) ✓ Current

## Notes

- PvC matches are used because they auto-start (no need for second player)
- AI moves are handled automatically by the contract
- Each move submission increments the move count by 2 (player move + AI move)
- The script uses deterministic state hashes for simplicity

## Troubleshooting

**Error: "match: not white turn"**
- The move count tracking might be off. The script assumes AI moves happen automatically.

**Error: Insufficient gas**
- Increase gas limit or reduce number of transactions

**Error: "match: inactive"**
- Match might have been completed or cancelled. Check match status first.

