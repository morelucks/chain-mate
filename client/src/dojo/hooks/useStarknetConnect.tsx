// hooks/useStarknetConnect.ts
import { useConnect, useAccount, useDisconnect } from "@starknet-react/core";
import { useEffect, useState, useCallback } from "react";

export function useStarknetConnect() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { status, address } = useAccount();
  const [hasTriedConnect, setHasTriedConnect] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [controllerUsername, setControllerUsername] = useState<string | null>(null);

  const readUsernameFromConnector = useCallback(() => {
    try {
      const anyConnector = connectors[0] as any;
      // Try common places the Cartridge connector exposes session info
      const name =
        anyConnector?.session?.username ||
        anyConnector?.session?.profile?.username ||
        anyConnector?.controller?.profile?.username ||
        null;

      if (typeof name === "string" && name.length > 0) {
        setControllerUsername(name);
      }
    } catch {}
  }, [connectors]);

  useEffect(() => {
    // Also try reading from localStorage as fallback (connector often persists there)
    if (!controllerUsername) {
      try {
        const keys = Object.keys(window.localStorage);
        const key = keys.find((k) => k.toLowerCase().includes("cartridge") && k.toLowerCase().includes("username"));
        if (key) {
          const v = window.localStorage.getItem(key);
          if (v && v.length > 0) setControllerUsername(v.replace(/\"/g, ""));
        }
      } catch {}
    }
  }, [controllerUsername]);

  const handleConnect = useCallback(async () => {
    const connector = connectors[0]; // Cartridge connector
    if (!connector) {
      console.error("No connector found");
      return;
    }
    try {
      setIsConnecting(true);
      setHasTriedConnect(true);
      console.log("🔗 Attempting to connect controller...");
      await connect({ connector });
      readUsernameFromConnector();
      console.log("✅ controller connected successfully");
    } catch (error) {
      console.error("❌ Connection failed:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [connect, connectors, readUsernameFromConnector]);

  const handleDisconnect = useCallback(async () => {
    try {
      console.log("🔌 Disconnecting controller...");
      await disconnect();
      setHasTriedConnect(false);
      setControllerUsername(null);
      console.log("✅ controller disconnected successfully");
    } catch (error) {
      console.error("❌ Disconnection failed:", error);
    }
  }, [disconnect]);

  useEffect(() => {
    // refresh username whenever connection status changes
    if (status === "connected") readUsernameFromConnector();
  }, [status, readUsernameFromConnector]);

  console.log("🎮 Mantle Network Connect Status:", {
    status,
    address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null,
    isConnecting,
    hasTriedConnect,
    availableConnectors: connectors.length,
    controllerUsername,
  });

  return {
    status,
    address,
    controllerUsername,
    isConnecting,
    hasTriedConnect,
    handleConnect,
    handleDisconnect,
    setHasTriedConnect,
  };
}