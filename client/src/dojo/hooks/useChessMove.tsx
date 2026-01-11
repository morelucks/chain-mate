import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { Account } from "starknet";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { dojoConfig } from "../dojoConfig";

interface MoveParams {
  gameId: number;
  fromRank: number;
  fromFile: number;
  toRank: number;
  toFile: number;
}

export const useChessMove = () => {
  const { client } = useDojoSDK();
  const { account } = useAccount();
  const supportsCreateGame = (() => {
    try {
      const contracts = (dojoConfig as any)?.manifest?.contracts ?? [];
      for (const contract of contracts) {
        const abi = contract?.abi ?? [];
        for (const item of abi) {
          if (item?.type === "interface" && Array.isArray(item.items)) {
            const hasMethod = item.items.some((fn: any) => fn?.name === "create_single_player_game");
            if (hasMethod) return true;
          }
          if (item?.type === "function" && item?.name === "create_single_player_game") {
            return true;
          }
        }
      }
    } catch (_) {}
    return false;
  })();

  const supportsResignGame = (() => {
    try {
      const contracts = (dojoConfig as any)?.manifest?.contracts ?? [];
      for (const contract of contracts) {
        const abi = contract?.abi ?? [];
        for (const item of abi) {
          if (item?.type === "interface" && Array.isArray(item.items)) {
            const hasMethod = item.items.some((fn: any) => fn?.name === "resign_game");
            if (hasMethod) return true;
          }
          if (item?.type === "function" && item?.name === "resign_game") {
            return true;
          }
        }
      }
    } catch (_) {}
    return false;
  })();
  
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const makeMove = useCallback(async (params: MoveParams) => {
    if (!account) {
      setError("No account connected");
      return { success: false, error: "No account connected" };
    }

    setIsMoving(true);
    setError(null);
    setTxHash(null);

    try {
      console.log("🎯 Making chess move:", params);
      
      // Call the make_move system function
      const result = await client.game.makeMove(
        account as Account,
        params.gameId,
        params.fromRank,
        params.fromFile,
        params.toRank,
        params.toFile
      );

      console.log("📥 Move result:", result);

      if (result?.transaction_hash) {
        setTxHash(result.transaction_hash);
      }

      if (result && result.code === "SUCCESS") {
        console.log("✅ Move successful!");
        return { success: true, txHash: result.transaction_hash };
      } else {
        throw new Error(`Move failed with code: ${result?.code}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Move failed";
      console.error("❌ Move error:", error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsMoving(false);
    }
  }, [account, client.game]);

  const createGame = useCallback(async (isSinglePlayer: boolean = true) => {
    if (!account) {
      setError("No account connected");
      return { success: false, error: "No account connected" };
    }

    if (!supportsCreateGame) {
      const msg = "Create game is not supported by the current deployed contracts";
      setError(msg);
      return { success: false, error: msg };
    }

    setIsMoving(true);
    setError(null);

    try {
      console.log("🎮 Creating game:", { isSinglePlayer });
      
      const result = isSinglePlayer 
        ? await client.game.createSinglePlayerGame(account as Account)
        : await client.game.createMultiPlayerGame(account as Account, account.address);

      console.log("📥 Game creation result:", result);

      if (result?.transaction_hash) {
        setTxHash(result.transaction_hash);
      }

      if (result && result.code === "SUCCESS") {
        console.log("✅ Game created!");
        return { success: true, txHash: result.transaction_hash };
      } else {
        throw new Error(`Game creation failed with code: ${result?.code}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Game creation failed";
      console.error("❌ Game creation error:", error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsMoving(false);
    }
  }, [account, client.game, supportsCreateGame]);

  const resignGame = useCallback(async (gameId: number) => {
    if (!account) {
      setError("No account connected");
      return { success: false, error: "No account connected" };
    }
    if (!supportsResignGame) {
      const msg = "Resign is not supported by the current deployed contracts";
      setError(msg);
      return { success: false, error: msg };
    }
    setIsMoving(true);
    setError(null);
    setTxHash(null);
    try {
      const result = await client.game.resignGame(account as Account, gameId);
      if (result?.transaction_hash) setTxHash(result.transaction_hash);
      if (result && result.code === "SUCCESS") {
        return { success: true, txHash: result.transaction_hash };
      }
      throw new Error(`Resign failed with code: ${result?.code}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Resign failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsMoving(false);
    }
  }, [account, client.game, supportsResignGame]);

  return {
    makeMove,
    createGame,
    resignGame,
    isMoving,
    error,
    txHash,
    isConnected: !!account,
    supportsCreateGame,
    supportsResignGame
  };
};
