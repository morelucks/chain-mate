import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

// Mantle Network configuration
const MANTLE_CHAIN_ID = 5000;
const MANTLE_RPC_URL = "https://rpc.mantle.xyz";
const MANTLE_NETWORK = {
  chainId: `0x${MANTLE_CHAIN_ID.toString(16)}`,
  chainName: "Mantle Network",
  nativeCurrency: {
    name: "Mantle",
    symbol: "MNT",
    decimals: 18,
  },
  rpcUrls: [MANTLE_RPC_URL],
  blockExplorerUrls: ["https://explorer.mantle.xyz"],
};

export type WalletStatus = "disconnected" | "connecting" | "connected";

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  isConnecting: boolean;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    status: "disconnected",
    address: null,
    isConnecting: false,
    provider: null,
    signer: null,
  });
  const [error, setError] = useState<string | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    const installed = typeof window !== "undefined" && typeof window.ethereum !== "undefined";
    console.log("🔍 MetaMask check:", { installed, hasWindow: typeof window !== "undefined", hasEthereum: typeof window !== "undefined" && typeof window.ethereum !== "undefined" });
    return installed;
  }, []);

  // Add Mantle Network to MetaMask if not already added
  const addMantleNetwork = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
    }

    try {
      await window.ethereum!.request({
        method: "wallet_addEthereumChain",
        params: [MANTLE_NETWORK],
      });
    } catch (error: any) {
      // If the network already exists, that's fine
      if (error.code !== 4902) {
        throw error;
      }
    }
  }, [isMetaMaskInstalled]);

  // Switch to Mantle Network
  const switchToMantleNetwork = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      throw new Error("MetaMask is not installed");
    }

    try {
      await window.ethereum!.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MANTLE_NETWORK.chainId }],
      });
    } catch (error: any) {
      // If the chain doesn't exist, add it
      if (error.code === 4902) {
        await addMantleNetwork();
      } else {
        throw error;
      }
    }
  }, [isMetaMaskInstalled, addMantleNetwork]);

  // Connect wallet
  const connect = useCallback(async () => {
    console.log("🔗 Starting wallet connection...");
    setError(null);
    
    if (!isMetaMaskInstalled()) {
      const errorMsg = "MetaMask is not installed. Please install MetaMask to continue.";
      console.error("❌", errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    console.log("✅ MetaMask detected, requesting connection...");
    setState((prev) => ({ ...prev, isConnecting: true, status: "connecting" }));

    try {
      // Request account access
      console.log("📝 Requesting accounts from MetaMask...");
      const accounts = await window.ethereum!.request({
        method: "eth_requestAccounts",
      });

      console.log("📝 Accounts received:", accounts);

      if (!accounts || accounts.length === 0) {
        const errorMsg = "No accounts found. Please unlock MetaMask and try again.";
        console.error("❌", errorMsg);
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      // Switch to Mantle Network
      console.log("🔄 Switching to Mantle Network...");
      try {
        await switchToMantleNetwork();
        console.log("✅ Switched to Mantle Network");
      } catch (networkError: any) {
        console.error("❌ Network switch error:", networkError);
        const errorMsg = networkError?.message || "Failed to switch to Mantle Network. Please switch manually in MetaMask.";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      // Create provider and signer
      console.log("🔧 Creating provider and signer...");
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      console.log("📍 Address:", address);
      
      // Verify we're on Mantle Network
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      console.log("🌐 Network Chain ID:", chainId, "Expected:", MANTLE_CHAIN_ID);
      
      if (chainId !== MANTLE_CHAIN_ID) {
        const errorMsg = `Please switch to Mantle Network (Chain ID: ${MANTLE_CHAIN_ID}). Current network: ${chainId}`;
        console.error("❌ Wrong network:", errorMsg);
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      setState({
        status: "connected",
        address,
        isConnecting: false,
        provider,
        signer,
      });
      
      setError(null);
      console.log("✅ Wallet connected successfully:", address);
    } catch (error: any) {
      console.error("❌ Connection failed:", error);
      console.error("❌ Error details:", {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack
      });
      const errorMessage = error?.message || "Failed to connect wallet. Please try again.";
      setError(errorMessage);
      setState((prev) => ({
        ...prev,
        status: "disconnected",
        isConnecting: false,
      }));
      throw error;
    }
  }, [isMetaMaskInstalled, switchToMantleNetwork]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState({
      status: "disconnected",
      address: null,
      isConnecting: false,
      provider: null,
      signer: null,
    });
    console.log("🔌 Wallet disconnected");
  }, []);

  // Check connection status on mount and when accounts change
  useEffect(() => {
    if (!isMetaMaskInstalled()) {
      return;
    }

    const checkConnection = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum!);
        const accounts = await provider.listAccounts();

        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          const chainId = await provider.getNetwork().then((n) => Number(n.chainId));

          // Only set as connected if on Mantle Network
          if (chainId === MANTLE_CHAIN_ID) {
            setState({
              status: "connected",
              address,
              isConnecting: false,
              provider,
              signer,
            });
          } else {
            // Connected but wrong network
            setState((prev) => ({
              ...prev,
              status: "disconnected",
            }));
          }
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    };

    checkConnection();

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        checkConnection();
      }
    };

    // Listen for chain changes
    const handleChainChanged = () => {
      checkConnection();
    };

    window.ethereum!.on("accountsChanged", handleAccountsChanged);
    window.ethereum!.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum!.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum!.removeListener("chainChanged", handleChainChanged);
    };
  }, [isMetaMaskInstalled, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    error,
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

