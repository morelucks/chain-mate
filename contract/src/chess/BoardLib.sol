// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BoardLib
/// @notice Library for chess board utilities: move encoding, turn validation, and square validation
library BoardLib {
    /// @notice Maximum valid square index (0-63 for 8x8 board)
    uint8 public constant MAX_SQUARE = 63;

    /// @notice Encodes a chess move into a bytes4 format
    /// @param fromSquare Source square (0-63)
    /// @param toSquare Destination square (0-63)
    /// @param extraData Additional move data (promotion, castling, etc.)
    /// @return encodedMove The encoded move as bytes4
    function encodeMove(uint8 fromSquare, uint8 toSquare, uint8 extraData) internal pure returns (bytes4) {
        require(fromSquare <= MAX_SQUARE, "BoardLib: invalid from square");
        require(toSquare <= MAX_SQUARE, "BoardLib: invalid to square");
        
        // Pack: fromSquare (8 bits) | toSquare (8 bits) | extraData (8 bits) | reserved (8 bits)
        return bytes4(
            (uint32(fromSquare) << 24) |
            (uint32(toSquare) << 16) |
            (uint32(extraData) << 8)
        );
    }

    /// @notice Decodes a bytes4 move into its components
    /// @param encodedMove The encoded move
    /// @return fromSquare Source square (0-63)
    /// @return toSquare Destination square (0-63)
    /// @return extraData Additional move data
    function decodeMove(bytes4 encodedMove) internal pure returns (uint8 fromSquare, uint8 toSquare, uint8 extraData) {
        uint32 move = uint32(encodedMove);
        fromSquare = uint8(move >> 24);
        toSquare = uint8((move >> 16) & 0xFF);
        extraData = uint8((move >> 8) & 0xFF);
        
        require(fromSquare <= MAX_SQUARE, "BoardLib: invalid from square");
        require(toSquare <= MAX_SQUARE, "BoardLib: invalid to square");
    }

    /// @notice Validates that a square index is within valid range (0-63)
    /// @param square The square index to validate
    /// @return isValid True if square is valid
    function isValidSquare(uint8 square) internal pure returns (bool) {
        return square <= MAX_SQUARE;
    }

    /// @notice Determines if it's white's turn based on move count
    /// @param moveCount The current move count (0 = initial position, white to move)
    /// @return isWhiteTurn True if it's white's turn
    function isWhiteTurn(uint8 moveCount) internal pure returns (bool) {
        // Even move counts = white's turn, odd = black's turn
        return moveCount % 2 == 0;
    }

    /// @notice Converts rank and file to square index
    /// @param rank Row (0-7, where 0 is bottom rank for white)
    /// @param file Column (0-7, where 0 is leftmost file)
    /// @return square The square index (0-63)
    function rankFileToSquare(uint8 rank, uint8 file) internal pure returns (uint8) {
        require(rank < 8, "BoardLib: invalid rank");
        require(file < 8, "BoardLib: invalid file");
        return rank * 8 + file;
    }

    /// @notice Converts square index to rank and file
    /// @param square The square index (0-63)
    /// @return rank Row (0-7)
    /// @return file Column (0-7)
    function squareToRankFile(uint8 square) internal pure returns (uint8 rank, uint8 file) {
        require(square <= MAX_SQUARE, "BoardLib: invalid square");
        rank = square / 8;
        file = square % 8;
    }
}

