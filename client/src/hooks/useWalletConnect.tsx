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
  } = useWalletContext();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    setError(null);
    try {
      if (!isMetaMaskInstalled) {
        const errorMsg = "MetaMask is not installed. Please install MetaMask to connect your wallet.";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      await connect();
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to connect wallet. Please try again.";
      setError(errorMessage);
      console.error("Connection failed:", error);
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

