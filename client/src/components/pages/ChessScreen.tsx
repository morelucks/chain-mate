// Import the chess components
import ChessGameWrapper from "../ChessGameWrapper";
import { useWalletConnect } from "../../hooks/useWalletConnect";
import { useSpawnPlayer } from "../../hooks/useSpawnPlayer";
import { useChessMove } from "../../hooks/useChessMove";
import { useState, useEffect } from "react";

export default function ChessScreen() {
  const { status, isConnecting, handleConnect, handleDisconnect, address, controllerUsername } = useWalletConnect();
  const { initializePlayer, isInitializing, txHash, txStatus, currentStep } = useSpawnPlayer();
  const { createGame, isMoving, error: moveError, txHash: moveTxHash } = useChessMove();
  const [currentGameMode, setCurrentGameMode] = useState('pvc');

  // Listen for game mode changes from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const gameMode = localStorage.getItem('currentGameMode') || 'pvc';
      setCurrentGameMode(gameMode);
    };

    // Set initial value
    handleStorageChange();

    // Listen for changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes (in case of same-tab updates)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Chainmate</h1>
            {status === "connected" && (
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {currentGameMode === 'pvc' ? '🤖 Player vs Computer' : '👥 Player vs Player'}
                </span>
              </div>
            )}
            <p className="text-xs text-slate-400">
              Connected to Mantle Network
              {controllerUsername ? (
                <span className="ml-2 text-white">• {controllerUsername}</span>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {status !== "connected" ? (
              <button
                className="px-3 py-1.5 rounded bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            ) : (
              <>
                <span className="text-xs text-slate-400 mr-2">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                <button
                  className="px-3 py-1.5 rounded border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white text-xs font-semibold transition"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </button>
              </>
            )}
            <button
              className="px-3 py-1.5 rounded bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs disabled:opacity-50 transition shadow-lg shadow-purple-500/20"
              onClick={() => initializePlayer()}
              disabled={status !== "connected" || isInitializing}
            >
              {isInitializing ? `Starting (${currentStep})...` : "Start Game"}
            </button>
            <button
              className="px-3 py-1.5 rounded bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs disabled:opacity-50 transition shadow-lg shadow-purple-500/20"
              onClick={() => createGame(true)}
              disabled={status !== "connected" || isMoving}
            >
              {isMoving ? "Creating..." : "Create Game"}
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Status */}
      {(txHash || moveTxHash || moveError) && (
        <div className="flex-shrink-0 px-4 py-2 bg-slate-800/30 border-b border-slate-700">
          {txHash && (
            <div className="text-xs text-white/80 mb-1">
              Spawn Tx: <a className="underline" href={`https://explorer.mantle.xyz/tx/${txHash}`} target="_blank" rel="noreferrer">{txHash}</a> ({txStatus || "PENDING"})
            </div>
          )}
          {moveTxHash && (
            <div className="text-xs text-white/80 mb-1">
              Game Tx: <a className="underline" href={`https://explorer.mantle.xyz/tx/${moveTxHash}`} target="_blank" rel="noreferrer">{moveTxHash}</a>
            </div>
          )}
          {moveError && (
            <div className="text-xs text-red-400">
              Error: {moveError}
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <ChessGameWrapper />
    </div>
  );
}
