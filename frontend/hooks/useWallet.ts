"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { arcTestnet } from "@/lib/config";

/**
 * Thin wrapper around wagmi's wallet hooks. Keeps components from
 * needing to know about wagmi directly and centralizes the "wrong
 * network" check for Arc Testnet.
 */
export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connectors, connect, isPending: isConnectPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== arcTestnet.id;

  function connectWallet() {
    // Prefer an injected wallet (MetaMask, Rabby, etc.) if available.
    const injected = connectors.find((c) => c.type === "injected") ?? connectors[0];
    if (!injected) {
      alert("No wallet connector available. Please install MetaMask.");
      return;
    }
    connect({ connector: injected });
  }

  function switchToArcTestnet() {
    switchChain({ chainId: arcTestnet.id });
  }

  return {
    address,
    isConnected,
    isConnecting: isConnecting || isConnectPending,
    isWrongNetwork,
    isSwitchingNetwork: isSwitchPending,
    connectError,
    connectWallet,
    disconnectWallet: disconnect,
    switchToArcTestnet,
  };
}
