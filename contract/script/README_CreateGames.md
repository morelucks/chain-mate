# Create Games Script

This script creates multiple chess games/matches with the deployed MatchManager contract on Base mainnet.

## What it does

Creates a configurable number of chess matches (games) on-chain. Supports both PvP and PvC game modes.

**Features:**
- Configurable number of games via environment variable
- Supports both PvP and PvC modes
- Optional staking configuration for PvP matches
- Error handling with detailed logging
- Progress tracking

## Prerequisites

1. Set up your `.env` file with:
   ```bash
   PRIVATE_KEY=your_private_key_here
   BASE_MAINNET_RPC=https://mainnet.base.org
   ```

2. Optional configuration variables:
   ```bash
   NUM_GAMES=50              # Number of games to create (default: 50)
   NUM_GAMES_MODE=1         # 0 = PvP, 1 = PvC (default: 1 = PvC)
   STAKE_TOKEN=0x...        # ERC20 token address for PvP staking (default: address(0) = no stake)
   STAKE_AMOUNT=0           # Stake amount in wei (default: 0)
   ```

3. Ensure your wallet has enough ETH on Base mainnet for gas fees
   - Estimated: ~0.0001 ETH per 50 games (varies with gas prices)

## Usage

### Basic usage (50 PvC games, no staking)

```bash
cd contract
source .env
export BASE_MAINNET_RPC="${BASE_MAINNET_RPC:-https://mainnet.base.org}"

forge script script/CreateGames.s.sol:CreateGames \
  --rpc-url "$BASE_MAINNET_RPC" \
  --broadcast \
  --chain-id 8453 \
  -vvv
```

### Create 100 PvC games

```bash
NUM_GAMES=100 forge script script/CreateGames.s.sol:CreateGames \
  --rpc-url "$BASE_MAINNET_RPC" \
  --broadcast \
  --chain-id 8453
```

### Create 50 PvP games with staking

**⚠️ IMPORTANT:** PvP mode REQUIRES a valid ERC20 token address and stake amount. If you set `NUM_GAMES_MODE=0` but don't provide a valid `STAKE_TOKEN`, the script will automatically switch to PvC mode.

```bash
NUM_GAMES=50 \
NUM_GAMES_MODE=0 \
STAKE_TOKEN=0xYourERC20TokenAddress \
STAKE_AMOUNT=1000000000000000000 \
forge script script/CreateGames.s.sol:CreateGames \
  --rpc-url "$BASE_MAINNET_RPC" \
  --broadcast \
  --chain-id 8453
```

**Before running PvP with staking, ensure:**
1. You have approved the MatchManager contract to spend your tokens
2. You have sufficient token balance
3. The token address is correct for Base mainnet

### Dry run (simulate without broadcasting)

```bash
forge script script/CreateGames.s.sol:CreateGames \
  --rpc-url "$BASE_MAINNET_RPC" \
  --chain-id 8453
```

## Configuration Examples

### Example 1: Create 200 PvC games (free play)

```bash
NUM_GAMES=200 forge script script/CreateGames.s.sol:CreateGames \
  --rpc-url "$BASE_MAINNET_RPC" \
  --broadcast \
  --chain-id 8453
```

### Example 2: Create 10 PvP games with 1 token stake

```bash
NUM_GAMES=10 \
NUM_GAMES_MODE=0 \
STAKE_TOKEN=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
STAKE_AMOUNT=1000000000000000000 \
forge script script/CreateGames.s.sol:CreateGames \
  --rpc-url "$BASE_MAINNET_RPC" \
  --broadcast \
  --chain-id 8453
```

**Note:** For PvP games with staking, you need to:
1. Have the ERC20 token approved for the MatchManager contract
2. Have sufficient token balance
3. Set `STAKE_TOKEN` to the token contract address
4. Set `STAKE_AMOUNT` in wei (e.g., 1e18 for 1 token with 18 decimals)

## Output

The script will:
- Print configuration details
- Show progress (every 10th game)
- Display summary with success/failure counts
- List first and last few match IDs
- Save transaction details to `broadcast/CreateGames.s.sol/8453/run-latest.json`

## Game Modes

### PvC (Player vs Computer)
- Auto-starts immediately (AI joins automatically)
- No staking required (can be set to 0)
- Perfect for testing and generating activity

### PvP (Player vs Player)
- Requires a second player to join
- Staking is required (both players must stake)
- Winner takes all from the pot
- More realistic but requires coordination

## Troubleshooting

**Error: "match: stake required"**
- PvP mode requires a valid ERC20 token address (not `address(0)`) AND a stake amount > 0
- The script now automatically detects this and switches to PvC mode if PvP is requested without valid staking
- To create PvP matches, you MUST provide:
  - `STAKE_TOKEN` = valid ERC20 contract address on Base
  - `STAKE_AMOUNT` = amount in wei (e.g., 1e18 for 1 token)

**Error: "stake: transferFrom"**
- For PvP with staking, ensure:
  - You have approved the MatchManager to spend your tokens
  - You have sufficient token balance
  - The token address is correct

**Error: Insufficient gas**
- Reduce `NUM_GAMES` or increase gas limit
- Check current gas prices on Base

**High failure rate**
- Check network connectivity
- Verify contract address is correct
- Ensure sufficient ETH for gas

## Notes

- PvC games are recommended for bulk creation (faster, no coordination needed)
- Each game creation is a separate transaction
- Match IDs are sequential starting from the current `nextMatchId`
- Failed creations are logged but don't stop the script
- The script uses try-catch to handle errors gracefully

