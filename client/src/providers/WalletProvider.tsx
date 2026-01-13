import { createContext, useContext, type PropsWithChildren } from "react";
import { useWallet, type WalletState } from "../hooks/useWallet";

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  isMetaMaskInstalled: boolean; // Legacy, for backward compatibility
  isWalletInstalled: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: PropsWithChildren) {
  const wallet = useWallet();

  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
}

