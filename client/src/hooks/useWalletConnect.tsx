// Compatibility hook that matches the old useStarknetConnect interface
// but uses the new MetaMask wallet integration
import { useWalletContext } from "../providers/WalletProvider";
import { useCallback, useState } from "react";

export function useWalletConnect() {
  const {
    status,
    address,
    isConnecting,
    connect,
    disconnect,
    isMetaMaskInstalled,
    error: walletError,
  } = useWalletContext();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    setLocalError(null);
    console.log("🔗 useWalletConnect.handleConnect called");
    try {
      if (!isMetaMaskInstalled) {
        const errorMsg = "MetaMask is not installed. Please install MetaMask to connect your wallet.";
        console.error("❌ MetaMask not installed");
        setLocalError(errorMsg);
        throw new Error(errorMsg);
      }
      console.log("✅ MetaMask installed, calling connect()...");
      await connect();
      console.log("✅ connect() completed successfully");
    } catch (error: any) {
      console.error("❌ Error in handleConnect:", error);
      const errorMessage = error?.message || "Failed to connect wallet. Please try again.";
      setLocalError(errorMessage);
      throw error;
    }
  }, [connect, isMetaMaskInstalled]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // Map wallet status to old interface
  const mappedStatus = status === "connected" ? "connected" : 
                       status === "connecting" ? "connecting" : 
                       "disconnected";

  // Combine wallet error and local error
  const error = walletError || localError;

  return {
    status: mappedStatus,
    address,
    isConnecting,
    handleConnect,
    handleDisconnect,
    controllerUsername: null, // Not applicable for MetaMask
    setHasTriedConnect: () => {}, // Not needed for MetaMask
    hasTriedConnect: false,
    error,
    isMetaMaskInstalled,
  };
}

