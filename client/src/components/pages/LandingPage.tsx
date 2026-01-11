import HeroSection from "../landing/HeroSection";
import FeatureGrid from "../landing/FeatureGrid";
import StatsSection from "../landing/StatsSection";
import CTASection from "../landing/CTASection";
import { useNavigate } from "react-router-dom";
import { useWalletConnect } from "../../hooks/useWalletConnect";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { status, isConnecting, handleConnect, handleDisconnect, address, controllerUsername } = useWalletConnect();
  const [shouldNavigateAfterConnect, setShouldNavigateAfterConnect] = useState(false);

  // Auto-navigate to chess page once wallet is connected (if user clicked a button)
  useEffect(() => {
    if (status === "connected" && shouldNavigateAfterConnect) {
      setShouldNavigateAfterConnect(false);
      navigate("/chess");
    }
  }, [status, shouldNavigateAfterConnect, navigate]);

  const handleStartPlaying = async () => {
    if (status === "connected") {
      // Already connected, navigate directly
      navigate("/chess");
    } else {
      // Not connected, set flag and connect
      setShouldNavigateAfterConnect(true);
      await handleConnect();
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

