import HeroSection from "../landing/HeroSection";
import FeatureGrid from "../landing/FeatureGrid";
import StatsSection from "../landing/StatsSection";
import CTASection from "../landing/CTASection";
import { useNavigate } from "react-router-dom";
import { useWalletConnect } from "../../hooks/useWalletConnect";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { status, isConnecting, handleConnect, handleDisconnect, address, controllerUsername, error, isMetaMaskInstalled } = useWalletConnect();
  const [shouldNavigateAfterConnect, setShouldNavigateAfterConnect] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Auto-navigate to chess page once wallet is connected (if user clicked a button)
  useEffect(() => {
    if (status === "connected" && shouldNavigateAfterConnect) {
      setShouldNavigateAfterConnect(false);
      navigate("/chess");
    }
  }, [status, shouldNavigateAfterConnect, navigate]);

  const handleStartPlaying = async () => {
    console.log("🎮 handleStartPlaying called, status:", status);
    if (status === "connected") {
      // Already connected, navigate directly
      console.log("✅ Already connected, navigating to chess");
      navigate("/chess");
    } else {
      // Not connected, set flag and connect
      console.log("🔗 Not connected, attempting connection...");
      setShouldNavigateAfterConnect(true);
      setConnectionError(null);
      try {
        await handleConnect();
        console.log("✅ Connection successful in handleStartPlaying");
      } catch (err: any) {
        console.error("❌ Connection error in handleStartPlaying:", err);
        setConnectionError(err?.message || "Failed to connect wallet");
        setShouldNavigateAfterConnect(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Chess hero background image */}
        <img
          src="/chess-hero-bg.jpg"
          alt="Chess background"
          className="absolute inset-0 w-full h-full object-cover opacity-15"
        />

        {/* Existing code */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(139,92,246,0.4), transparent 40%), radial-gradient(circle at 80% 30%, rgba(59,130,246,0.3), transparent 45%), radial-gradient(circle at 50% 80%, rgba(236,72,153,0.25), transparent 50%)",
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 max-w-6xl flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            ♟ Chainmate
          </div>
          {/* Mobile Connect Button */}
          <div className="md:hidden">
            {status === "connected" ? (
              <button
                onClick={handleStartPlaying}
                className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-semibold text-sm transition"
              >
                Play
              </button>
            ) : (
              <button
                onClick={handleStartPlaying}
                disabled={isConnecting}
                className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? "..." : "Connect"}
              </button>
            )}
          </div>
          <div className="hidden md:flex gap-8 items-center text-sm text-white/70">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#" className="hover:text-white transition">
              About
            </a>
            <a href="#" className="hover:text-white transition">
              Docs
            </a>
            {status === "connected" ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-purple-200">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                  {controllerUsername && ` • ${controllerUsername}`}
                </span>
                <button
                  onClick={handleStartPlaying}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-semibold transition"
                >
                  Play Now
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-2 rounded border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 transition text-xs"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartPlaying}
                disabled={isConnecting}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? "Connecting..." : "Connect & Play"}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Error Message */}
      {(error || connectionError || !isMetaMaskInstalled) && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-red-500/90 backdrop-blur-sm border border-red-400 rounded-lg p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">
                  {!isMetaMaskInstalled ? "MetaMask Not Found" : "Connection Error"}
                </h3>
                <p className="text-white/90 text-sm">
                  {!isMetaMaskInstalled 
                    ? "Please install MetaMask browser extension to connect your wallet."
                    : error || connectionError || "Failed to connect wallet. Please try again."}
                </p>
                {!isMetaMaskInstalled && (
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white underline text-sm mt-2 inline-block"
                  >
                    Download MetaMask →
                  </a>
                )}
              </div>
              <button
                onClick={() => setConnectionError(null)}
                className="text-white/80 hover:text-white"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="relative pt-24">
        <HeroSection onStartPlaying={handleStartPlaying} isConnecting={isConnecting} isConnected={status === "connected"} />
        <div id="features">
          <FeatureGrid />
        </div>
        <StatsSection />
        <CTASection onStartPlaying={handleStartPlaying} isConnecting={isConnecting} isConnected={status === "connected"} />
      </main>
    </div>
  );
}

