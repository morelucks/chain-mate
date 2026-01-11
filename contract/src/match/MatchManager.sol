// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BoardLib} from "../chess/BoardLib.sol";
import {ChessAI} from "../chess/ChessAI.sol";

interface IERC20Minimal {
    function transfer(address to, uint256 amount) external returns (bool);

    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title MatchManager
/// @notice Handles PvP match lifecycle and staking escrow for Chainmate.
contract MatchManager {
    /*//////////////////////////////////////////////////////////////
                             ENUMS & TYPES
    //////////////////////////////////////////////////////////////*/

    enum MatchStatus {
        None,
        WaitingForPlayer,
        Active,
        Completed,
        Cancelled
    }

    enum GameMode {
        PvP,
        PvC
    }

    enum PlayerColor {
        White,
        Black
    }

    struct StakeConfig {
        address token;
        uint256 amount;
    }

    struct PlayerSlot {
        address account;
        PlayerColor color;
        uint256 joinedAt;
        bool escrowed;
    }

    struct BoardState {
        bytes32 fenHash;
        uint8 moveCount;
    }

    struct Match {
        uint256 id;
        GameMode mode;
        MatchStatus status;
        StakeConfig stake;
        PlayerSlot white;
        PlayerSlot black;
        BoardState board;
        address winner;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 pot;
    }

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event MatchCreated(uint256 indexed matchId, address indexed creator, GameMode mode, StakeConfig stake);

    event MatchJoined(uint256 indexed matchId, address indexed player, PlayerColor color);

    event MatchStarted(uint256 indexed matchId, BoardState initialState);

    event MoveSubmitted(uint256 indexed matchId, address indexed player, BoardState board, bytes moveData);

    event MatchFinished(uint256 indexed matchId, address indexed winner, MatchStatus status, uint256 rewardAmount);

    event MatchCancelled(uint256 indexed matchId);

    event StakeWithdrawn(uint256 indexed matchId, address indexed player, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    uint256 public nextMatchId = 1;
    mapping(uint256 => Match) internal matches;

    /*//////////////////////////////////////////////////////////////
                                ACTIONS
    //////////////////////////////////////////////////////////////*/

    function createMatch(
        GameMode mode,
        PlayerColor creatorColor,
        address stakeToken,
        uint256 stakeAmount,
        bytes32 initialStateHash
    ) external returns (uint256 matchId) {
        matchId = nextMatchId++;

        Match storage matchRef = matches[matchId];
        matchRef.id = matchId;
        matchRef.mode = mode;
        matchRef.status = MatchStatus.WaitingForPlayer;
        matchRef.createdAt = block.timestamp;
        matchRef.updatedAt = block.timestamp;
        matchRef.stake = StakeConfig(stakeToken, stakeAmount);
        matchRef.board = BoardState({fenHash: initialStateHash, moveCount: 0});

        _validateStakeConfig(mode, stakeToken, stakeAmount);

        PlayerSlot memory slot =
            PlayerSlot({account: msg.sender, color: creatorColor, joinedAt: block.timestamp, escrowed: false});

        if (creatorColor == PlayerColor.White) {
            matchRef.white = slot;
        } else {
            matchRef.black = slot;
        }

        _collectStake(matchRef, msg.sender);

        // PvC matches auto-start (no need to wait for opponent)
        if (mode == GameMode.PvC) {
            // Set AI as the opponent (opposite color of creator)
            PlayerColor aiColor = creatorColor == PlayerColor.White ? PlayerColor.Black : PlayerColor.White;
            PlayerSlot memory aiSlot = PlayerSlot({
                account: address(this), // AI is represented by contract address
                color: aiColor,
                joinedAt: block.timestamp,
                escrowed: false // AI doesn't stake
            });

            if (aiColor == PlayerColor.White) {
                matchRef.white = aiSlot;
            } else {
                matchRef.black = aiSlot;
            }

            matchRef.status = MatchStatus.Active;
            matchRef.updatedAt = block.timestamp;
            emit MatchStarted(matchId, matchRef.board);
        }

        emit MatchCreated(matchId, msg.sender, mode, matchRef.stake);
    }

    function joinMatch(uint256 matchId) external {
        Match storage matchRef = _requireMatch(matchId);
        require(matchRef.mode == GameMode.PvP, "match: pvc no join");
        require(matchRef.status == MatchStatus.WaitingForPlayer, "match: not open");
        require(msg.sender != matchRef.white.account && msg.sender != matchRef.black.account, "match: already joined");

        if (matchRef.white.account == address(0)) {
            matchRef.white = PlayerSlot(msg.sender, PlayerColor.White, block.timestamp, false);
            emit MatchJoined(matchId, msg.sender, PlayerColor.White);
        } else if (matchRef.black.account == address(0)) {
            matchRef.black = PlayerSlot(msg.sender, PlayerColor.Black, block.timestamp, false);
            emit MatchJoined(matchId, msg.sender, PlayerColor.Black);
        } else {
            revert("match: already full");
        }

        _collectStake(matchRef, msg.sender);

        if (matchRef.white.account != address(0) && matchRef.black.account != address(0)) {
            matchRef.status = MatchStatus.Active;
            matchRef.updatedAt = block.timestamp;
            emit MatchStarted(matchId, matchRef.board);
        }
    }

    function submitMove(uint256 matchId, bytes32 newStateHash, bytes calldata moveData) external {
        Match storage matchRef = _requireMatch(matchId);
        require(matchRef.status == MatchStatus.Active, "match: inactive");
        require(msg.sender == matchRef.white.account || msg.sender == matchRef.black.account, "match: not player");

        // Validate move data format (must be at least 4 bytes for encoded move)
        require(moveData.length >= 4, "move: invalid format");

        // Decode move to validate square indices
        bytes4 encodedMove = bytes4(moveData);
        (uint8 fromSquare, uint8 toSquare,) = BoardLib.decodeMove(encodedMove);

        // Validate it's the correct player's turn
        bool isWhiteTurn = BoardLib.isWhiteTurn(matchRef.board.moveCount);
        if (isWhiteTurn) {
            require(msg.sender == matchRef.white.account, "move: not white turn");
        } else {
            require(msg.sender == matchRef.black.account, "move: not black turn");
        }

        // Update board state
        matchRef.board = BoardState({fenHash: newStateHash, moveCount: matchRef.board.moveCount + 1});
        matchRef.updatedAt = block.timestamp;

        emit MoveSubmitted(matchId, msg.sender, matchRef.board, moveData);

        // Auto-trigger AI move in PvC matches if it's AI's turn
        if (matchRef.mode == GameMode.PvC) {
            _triggerAIMove(matchRef);
        }
    }

    /// @notice Triggers an AI move in a PvC match
    /// @param matchId The ID of the match
    function triggerAIMove(uint256 matchId) external {
        Match storage matchRef = _requireMatch(matchId);
        require(matchRef.mode == GameMode.PvC, "match: not pvc");
        require(matchRef.status == MatchStatus.Active, "match: inactive");
        _triggerAIMove(matchRef);
    }

    function finishMatch(uint256 matchId, address winner) external {
        Match storage matchRef = _requireMatch(matchId);
        require(matchRef.status == MatchStatus.Active, "match: not active");
        require(winner == matchRef.white.account || winner == matchRef.black.account, "match: invalid winner");

        // In PvC, only human player can win (AI doesn't stake, so can't receive payout)
        if (matchRef.mode == GameMode.PvC) {
            address aiAccount = address(this);
            require(winner != aiAccount, "match: ai cannot win");
        }

        matchRef.status = MatchStatus.Completed;
        matchRef.winner = winner;
        matchRef.updatedAt = block.timestamp;

        uint256 reward = _payout(matchRef);

        emit MatchFinished(matchId, winner, MatchStatus.Completed, reward);
    }

    function cancelMatch(uint256 matchId) external {
        Match storage matchRef = _requireMatch(matchId);
        require(matchRef.status == MatchStatus.WaitingForPlayer, "match: cannot cancel");
        require(msg.sender == matchRef.white.account || msg.sender == matchRef.black.account, "match: not player");

        matchRef.status = MatchStatus.Cancelled;
        matchRef.updatedAt = block.timestamp;

        _refundStake(matchRef, PlayerColor.White);
        _refundStake(matchRef, PlayerColor.Black);

        emit MatchCancelled(matchId);
    }

    function getMatch(uint256 matchId) external view returns (Match memory) {
        return matches[matchId];
    }

    function version() external pure returns (string memory) {
        return "0.5.0-pvc-support";
    }

    /*//////////////////////////////////////////////////////////////
                              INTERNALS
    //////////////////////////////////////////////////////////////*/

    function _requireMatch(uint256 matchId) internal view returns (Match storage matchRef) {
        matchRef = matches[matchId];
        require(matchRef.id != 0, "match: invalid id");
    }

    function _validateStakeConfig(GameMode mode, address token, uint256 amount) internal pure {
        if (mode == GameMode.PvP) {
            require(token != address(0) && amount > 0, "match: stake required");
        }
        // PvC matches can have optional staking (player can stake to make it more interesting)
    }

    function _collectStake(Match storage matchRef, address from) internal {
        StakeConfig memory stake = matchRef.stake;
        if (stake.token == address(0) || stake.amount == 0 || from == address(0)) return;

        _safeTransferFrom(stake.token, from, address(this), stake.amount);
        matchRef.pot += stake.amount;

        if (from == matchRef.white.account) {
            matchRef.white.escrowed = true;
        } else if (from == matchRef.black.account) {
            matchRef.black.escrowed = true;
        }
    }

    function _payout(Match storage matchRef) internal returns (uint256 reward) {
        reward = matchRef.pot;
        if (reward == 0 || matchRef.winner == address(0)) return reward;

        matchRef.pot = 0;
        matchRef.white.escrowed = false;
        matchRef.black.escrowed = false;

        _safeTransfer(matchRef.stake.token, matchRef.winner, reward);
        emit StakeWithdrawn(matchRef.id, matchRef.winner, reward);
    }

    function _refundStake(Match storage matchRef, PlayerColor color) internal {
        StakeConfig memory stake = matchRef.stake;
        if (stake.token == address(0) || stake.amount == 0) return;

        PlayerSlot storage slot = color == PlayerColor.White ? matchRef.white : matchRef.black;
        if (!slot.escrowed || slot.account == address(0)) return;

        slot.escrowed = false;
        matchRef.pot -= stake.amount;
        _safeTransfer(stake.token, slot.account, stake.amount);
        emit StakeWithdrawn(matchRef.id, slot.account, stake.amount);
    }

    function _safeTransferFrom(address token, address from, address to, uint256 amount) private {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(IERC20Minimal.transferFrom.selector, from, to, amount));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "stake: transferFrom");
    }

    function _safeTransfer(address token, address to, uint256 amount) private {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(IERC20Minimal.transfer.selector, to, amount));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "stake: transfer");
    }

    /// @dev Internal function to trigger AI move in PvC matches
    function _triggerAIMove(Match storage matchRef) internal {
        // Check if AI is the opponent
        address aiAccount = address(this);
        bool aiIsWhite = matchRef.white.account == aiAccount;
        bool aiIsBlack = matchRef.black.account == aiAccount;

        if (!aiIsWhite && !aiIsBlack) return; // Not a PvC match

        // Check if it's AI's turn
        bool isWhiteTurn = BoardLib.isWhiteTurn(matchRef.board.moveCount);
        if ((aiIsWhite && !isWhiteTurn) || (aiIsBlack && isWhiteTurn)) {
            return; // Not AI's turn
        }

        // Generate AI move
        bytes4 aiMove = ChessAI.generateMove(matchRef.board.moveCount, matchRef.board.fenHash);

        // Generate new state hash (deterministic based on current state + move)
        bytes32 newStateHash = keccak256(abi.encodePacked(matchRef.board.fenHash, aiMove, matchRef.board.moveCount));

        // Update board state
        matchRef.board = BoardState({fenHash: newStateHash, moveCount: matchRef.board.moveCount + 1});
        matchRef.updatedAt = block.timestamp;

        emit MoveSubmitted(matchRef.id, aiAccount, matchRef.board, abi.encodePacked(aiMove));
    }
}
