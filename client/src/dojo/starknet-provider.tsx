import React, { type PropsWithChildren } from "react";
import { sepolia, mainnet } from "@starknet-react/chains";
import {
    jsonRpcProvider,
    StarknetConfig,
    starkscan,
} from "@starknet-react/core";
import cartridgeConnector from "../config/cartridgeConnector";
import { handleIframeAuth } from "../utils/iframeDetection";

export default function StarknetProvider({ children }: PropsWithChildren) {
    const { VITE_PUBLIC_DEPLOY_TYPE, VITE_PUBLIC_NODE_URL } = import.meta.env;

    // Handle iframe authentication issues
    React.useEffect(() => {
        handleIframeAuth();
    }, []);

    const getRpcUrl = () => {
        if (VITE_PUBLIC_NODE_URL && VITE_PUBLIC_NODE_URL.length > 0) {
            return VITE_PUBLIC_NODE_URL;
        }
        switch (VITE_PUBLIC_DEPLOY_TYPE) {
            case "mainnet":
                return "https://api.cartridge.gg/x/starknet/mainnet";
            case "sepolia":
                return "https://starknet-sepolia.public.blastapi.io/rpc/v0_8";
            default:
                return "https://starknet-sepolia.public.blastapi.io/rpc/v0_8";
        }
    };

    const provider = jsonRpcProvider({
        rpc: () => ({ nodeUrl: getRpcUrl() }),
    });

    const chains = VITE_PUBLIC_DEPLOY_TYPE === "mainnet" 
        ? [mainnet] 
        : [sepolia];

    return (
        <StarknetConfig
            autoConnect
            chains={chains}
            connectors={[cartridgeConnector]}
            explorer={starkscan}
            provider={provider}
        >
            {children}
        </StarknetConfig>
    );
}