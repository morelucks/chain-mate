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

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
  }, []);

  // Add Mantle Network to MetaMask if not already added
  const addMantleNetwork = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
    }

    try {
      await window.ethereum.request({
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
      await window.ethereum.request({
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
    if (!isMetaMaskInstalled()) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
    }

    setState((prev) => ({ ...prev, isConnecting: true, status: "connecting" }));

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Switch to Mantle Network
      await switchToMantleNetwork();

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setState({
        status: "connected",
        address,
        isConnecting: false,
        provider,
        signer,
      });

      console.log("✅ Wallet connected:", address);
    } catch (error: any) {
      console.error("❌ Connection failed:", error);
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
        const provider = new ethers.BrowserProvider(window.ethereum);
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

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [isMetaMaskInstalled, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    isMetaMaskInstalled: isMetaMaskInstalled(),
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

