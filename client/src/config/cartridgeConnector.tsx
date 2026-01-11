// This file is no longer used - kept for reference
// Replaced with MetaMask wallet integration
// import { Connector } from "@starknet-react/core";
// import { ControllerConnector } from "@cartridge/connector";
// import { ControllerOptions } from "@cartridge/controller";
// import { constants } from "starknet";
import { manifest } from "./manifest";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

console.log("VITE_PUBLIC_DEPLOY_TYPE", VITE_PUBLIC_DEPLOY_TYPE);

const getRpcUrl = () => {
  switch (VITE_PUBLIC_DEPLOY_TYPE) {
    case "localhost":
        return "http://localhost:5050"; // Katana localhost default port
    case "mainnet":
        return "https://api.cartridge.gg/x/starknet/mainnet";
    case "sepolia":
        return "https://api.cartridge.gg/x/starknet/sepolia";
    default:
        return "https://api.cartridge.gg/x/starknet/sepolia";
  }
};

const getDefaultChainId = () => {
  // No longer used - replaced with Mantle Network
  return "0x1388"; // Mantle Network Chain ID (5000 in hex)
};

const getContractAddressByTag = (tag: string): string | null => {
  try {
    const found = (manifest as any).contracts?.find((c: any) => c?.tag === tag);
    return found?.address ?? null;
  } catch {
    return null;
  }
};

// chess actions contract (deployment tag from manifest)
const CONTRACT_ADDRESS_CHESS = getContractAddressByTag("full_starter_react-chess_actions");
// fallback to first if tag not found (defensive)
const CONTRACT_ADDRESS_FALLBACK = (manifest as any).contracts?.[0]?.address ?? null;
const CONTRACT_ADDRESS = CONTRACT_ADDRESS_CHESS || CONTRACT_ADDRESS_FALLBACK || "0x0";

console.log("Using chess contract address:", CONTRACT_ADDRESS);

const policies = {
  contracts: CONTRACT_ADDRESS !== "0x0" ? {
    [CONTRACT_ADDRESS]: {
      // Only external (state-changing) calls need policy entries
      methods: [
        { name: "create_single_player_game", entrypoint: "create_single_player_game" },
        { name: "make_move", entrypoint: "make_move" },
        { name: "resign_game", entrypoint: "resign_game" },
      ],
    },
  } : {},
}

// Stub - no longer used
const cartridgeConnector = null;

export default cartridgeConnector;
