import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Mantle Network Wallet Provider
import { WalletProvider } from "./providers/WalletProvider";

// App Entry
import App from "./app/app";
import "./index.css";

// Initialize app
function main() {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  createRoot(rootElement).render(
    <StrictMode>
      <WalletProvider>
        <App />
      </WalletProvider>
    </StrictMode>
  );
}

main();
