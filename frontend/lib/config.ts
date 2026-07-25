import { http, createConfig } from "wagmi";
import { defineChain } from "viem";

/**
 * Arc Testnet — Circle's stablecoin-native L1.
 * Source: https://docs.arc.io/arc/references/connect-to-arc
 *
 * Note: Arc uses USDC as its native gas token (not ETH), 18 decimals.
 * Wallets that don't support custom gas tokens will still work for
 * signing/sending, but may display the balance label as "ETH" even
 * though the underlying token is USDC. This is actually a good fit
 * for UndoPay since escrowed amounts (msg.value) are effectively
 * USDC on this chain.
 */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

/**
 * Local Hardhat network — useful for development before deploying
 * to Arc Testnet. Run `npx hardhat node` in the contracts project,
 * then point MetaMask at http://127.0.0.1:8545 (chain id 31337).
 */
export const localHardhat = defineChain({
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [arcTestnet, localHardhat],
  transports: {
    // retryCount/retryDelay smooth over Arc's public RPC occasionally
    // returning transient errors (rate limits, brief outages) instead
    // of failing the whole call immediately.
    [arcTestnet.id]: http(undefined, {
      retryCount: 5,
      retryDelay: 1500,
      timeout: 15000,
    }),
    [localHardhat.id]: http(),
  },
});
