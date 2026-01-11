// Compatibility hook that matches the old useStarknetConnect interface
// but uses the new MetaMask wallet integration
import { useWalletContext } from "../providers/WalletProvider";
import { useCallback } from "react";

export function useWalletConnect() {
  const {
    status,
    address,
    isConnecting,
    connect,
    disconnect,
  } = useWalletContext();

  const handleConnect = useCallback(async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Connection failed:", error);
      throw error;
    }
  }, [connect]);

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
  };
}

