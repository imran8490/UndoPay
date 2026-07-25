import { wagmiConfig } from "./config";

/**
 * Central wagmi config used by <WagmiProvider config={wagmiConfig}>
 * in app/layout.tsx. Chain definitions live in ./config.ts — this
 * file just re-exports so components can `import { wagmiConfig }
 * from "@/lib/wagmi"` per the original folder structure.
 */
export { wagmiConfig };
