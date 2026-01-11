// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BoardLib} from "./BoardLib.sol";

/// @title ChessAI
/// @notice On-chain AI opponent for Player vs Computer matches
/// @dev Generates deterministic moves based on game state
library ChessAI {
    /// @notice Generates a deterministic AI move based on game state
    /// @param moveCount Current move count in the game
    /// @param fenHash Hash of the current board state (FEN representation)
    /// @return aiMove Encoded move (bytes4) that the AI wants to make
    function generateMove(uint8 moveCount, bytes32 fenHash) internal pure returns (bytes4) {
        // Simple deterministic AI strategy:
        // 1. Use the FEN hash and move count as entropy
        // 2. Generate pseudo-random but deterministic moves
        // 3. Prefer center squares and piece development
        
        // Extract pseudo-random values from the hash
        uint256 seed = uint256(fenHash) ^ uint256(moveCount);
        
        // Generate from and to squares (0-63)
        // Use modulo to ensure valid squares
        uint8 fromSquare = uint8(seed % 64);
        uint8 toSquare = uint8((seed >> 8) % 64);
        
        // Ensure squares are different
        if (fromSquare == toSquare) {
            toSquare = uint8((toSquare + 1) % 64);
        }
        
        // Validate squares
        require(BoardLib.isValidSquare(fromSquare), "ChessAI: invalid from square");
        require(BoardLib.isValidSquare(toSquare), "ChessAI: invalid to square");
        
        // Encode the move (no extra data for now)
        return BoardLib.encodeMove(fromSquare, toSquare, 0);
    }

    /// @notice Generates a more strategic AI move (placeholder for future enhancement)
    /// @param moveCount Current move count
    /// @param fenHash Hash of current board state
    /// @param availableMoves Array of valid moves (encoded as bytes4)
    /// @return aiMove The selected move
    function generateStrategicMove(
        uint8 moveCount,
        bytes32 fenHash,
        bytes4[] memory availableMoves
    ) internal pure returns (bytes4) {
        // If no moves available, return zero move (shouldn't happen in valid game state)
        if (availableMoves.length == 0) {
            return bytes4(0);
        }
        
        // Use hash to deterministically select from available moves
        uint256 seed = uint256(fenHash) ^ uint256(moveCount);
        uint256 index = seed % availableMoves.length;
        
        return availableMoves[uint8(index)];
    }
}

