"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";

export default function WalletConnect() {
  // wagmi auto-reconnects a previously connected wallet on mount, so
  // isConnected can be false during server render and true right after
  // client hydration. Rendering the same "Connect wallet" button until
  // we've mounted avoids the resulting hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    address,
    isConnected,
    isConnecting,
    isWrongNetwork,
    isSwitchingNetwork,
    connectWallet,
    disconnectWallet,
    switchToArcTestnet,
  } = useWallet();

  if (!mounted || !isConnected) {
    return (
      <button
        onClick={connectWallet}
        disabled={!mounted || isConnecting}
        className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {mounted && isConnecting ? "Connecting..." : "Connect wallet"}
      </button>
    );
  }

  if (isWrongNetwork) {
    return (
      <button
        onClick={switchToArcTestnet}
        disabled={isSwitchingNetwork}
        className="rounded-xl bg-amber-600 px-5 py-2 font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
      >
        {isSwitchingNetwork ? "Switching..." : "Switch to Arc Testnet"}
      </button>
    );
  }

  return (
    <button
      onClick={() => disconnectWallet()}
      className="rounded-xl border border-gray-700 bg-gray-800 px-5 py-2 font-semibold text-white transition hover:bg-gray-700"
      title="Click to disconnect"
    >
      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
    </button>
  );
}
