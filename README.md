# UndoPay

**Crypto payments with a second chance.** UndoPay is an escrow smart contract + dApp that gives senders a short reclaim window before a payment finalizes — so a wrong wallet address doesn't have to mean lost funds forever.

Built on **Arc**, Circle's stablecoin-native L1 (USDC as the native gas token).

---

## How it works

1. **Connect Wallet** — connect an injected wallet (MetaMask, OKX Wallet, etc.) and switch to Arc Testnet.
2. **Send Payment** — sender enters a receiver address and a USDC amount. Funds are locked in the `UndoPayEscrow` smart contract.
3. **Escrow Lock** — the contract holds the funds and starts a 30-second reclaim window.
4. **Reclaim or Auto-Release**
   - Within the window, the sender can **reclaim** the funds back to their own wallet if they made a mistake.
   - Once the window expires, the app **automatically** triggers `releasePayment()` — there is no manual "Release" button in the UI. The connected wallet will prompt a one-time confirmation to sign the release transaction.
   - If a reclaim is already in flight (submitted, confirming, or confirmed) when the countdown hits zero, auto-release is held back so the two actions never race each other.

No backend, no custodian — everything is enforced on-chain by the smart contract.

---

## Tech stack

**Smart contract**
- Solidity `^0.8.19`
- OpenZeppelin `ReentrancyGuard`, `Pausable`, `Ownable`
- Hardhat + Hardhat Toolbox for compile/test/deploy

**Frontend**
- Next.js (App Router) + TypeScript
- wagmi + viem for wallet connection and contract calls
- TanStack Query (via wagmi) for on-chain data polling
- Tailwind CSS

**Network**
- Arc Testnet (chain ID `5042002`) — Circle's stablecoin-native L1, USDC is the native gas token
- Local Hardhat network for development (chain ID `31337`)

---

## Project structure

```
contracts/
  UndoPayEscrow.sol        # Escrow contract: create / reclaim / release / pause
scripts/
  deploy.ts                # Deploy + auto-verify script
test/
  UndoPayEscrow.ts         # Full Hardhat test suite
app/
  page.tsx                 # Landing page
  layout.tsx, providers.tsx, globals.css
  payment/[id]/            # Payment detail page (countdown + reclaim/release)
components/
  WalletConnect.tsx
  SendPaymentCard.tsx
  PaymentCard.tsx
  CountdownTimer.tsx
  ReclaimButton.tsx / ReleaseButton.tsx
  PaymentStatus.tsx
hooks/
  useWallet.ts
  usePayment.ts             # createPayment
  usePaymentDetails.ts      # getPayment (polled)
  useEscrowActions.ts        # reclaimPayment / releasePayment
lib/
  config.ts                 # chain definitions + wagmi config
  contract.ts                # contract address/ABI + types
  constants.ts                # reclaim window, status labels
```

---

## Smart contract: `UndoPayEscrow.sol`

| Function | Description |
|---|---|
| `createPayment(receiver)` `payable` | Locks `msg.value` in escrow for `receiver`. Blocked while paused. |
| `reclaimPayment(paymentId)` | Sender-only. Refunds the sender before `expiresAt`. Always available, even while paused. |
| `releasePayment(paymentId)` | Callable by anyone after `expiresAt`. Sends funds to the receiver. Blocked while paused. |
| `getPayment(paymentId)` | Returns full payment details. |
| `getTimeRemaining(paymentId)` | Seconds left in the reclaim window (0 if expired/resolved). |
| `pause()` / `unpause()` | Owner-only emergency controls for new deposits and releases. |

**Reclaim window:** `RECLAIM_WINDOW = 30 seconds` (constant, set at contract level).

**Custom errors:** `InvalidReceiver`, `ZeroAmount`, `PaymentNotFound`, `NotSender`, `PaymentExpired`, `PaymentNotExpired`, `InvalidStatus`, `TransferFailed`.

**Events:** `PaymentCreated`, `PaymentReclaimed`, `PaymentReleased`.

---

## Getting started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Create a `.env.local` (frontend) / `.env` (Hardhat) with:
```
PRIVATE_KEY=your_deployer_private_key
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
ETHERSCAN_API_KEY=your_key_if_verifying
NEXT_PUBLIC_UNDOPAY_ESCROW_ADDRESS=0xYourDeployedContractAddress
```

### 3. Compile & test the contract
```bash
npm run compile
npm run test
```

### 4. Deploy
```bash
npm run deploy:local     # local Hardhat network
npm run deploy:sepolia   # Sepolia testnet
npm run deploy:arc       # Arc Testnet
```
Copy the deployed address into `NEXT_PUBLIC_UNDOPAY_ESCROW_ADDRESS` in `.env.local` (or hardcode it in `lib/contract.ts`), then restart the dev server.

### 5. Run the frontend
```bash
npm run dev
```
Visit `http://localhost:3000`, connect a wallet, and switch to Arc Testnet.

---

## Known limitations

- **Auto-release requires an open tab.** Release is triggered client-side once the countdown hits zero — the payment's page needs to be open in a wallet-connected browser for the release transaction to fire automatically. A backend keeper bot would be needed for fully wallet-less, tab-independent auto-release.
- **Two wallet prompts per payment lifecycle.** Connecting a wallet and signing the release transaction are separate approvals by wallet-security design (e.g. MetaMask/OKX) and can't be merged into one prompt.
- **Tight-window race condition.** If a reclaim is submitted in the last couple of seconds before expiry, network latency can occasionally cause the reclaim to land just after `expiresAt`, in which case the contract correctly reverts the reclaim as expired. The auto-release effect explicitly checks `isReclaiming`, `isConfirmingReclaim`, and `reclaimConfirmed` before firing, so it never competes with an in-flight reclaim.
- **On-chain status polling lag.** Payment status (`getPayment`) is polled every 1.5s rather than read on every block, so there can be a brief moment right after a reclaim confirms where the UI hasn't caught up yet. The countdown is hidden as soon as `reclaimConfirmed` is true to avoid flashing a stale "expired" state during that gap.

---

## License

MIT

---

Built on Arc · 2026
