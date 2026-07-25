import UndoPayEscrowAbi from "./abi/UndoPayEscrow.json";

/**
 * Easiest way to set your deployed address: paste it here after
 * `npm run deploy:arc`. If you'd rather not commit it to source,
 * leave this as-is and set NEXT_PUBLIC_UNDOPAY_ESCROW_ADDRESS in
 * .env.local instead — the env var takes priority when set.
 */
export const CONTRACT_ADDRESS: `0x${string}` =
  "0xDc416BCFf2884a3af108F07c0B741a49E6E0FCa5";

export const UNDOPAY_ESCROW_ADDRESS =
  (process.env.NEXT_PUBLIC_UNDOPAY_ESCROW_ADDRESS as `0x${string}` | undefined) ||
  CONTRACT_ADDRESS;

export const UNDOPAY_ESCROW_ABI = UndoPayEscrowAbi;

/**
 * Shared config object to pass into wagmi's useReadContract /
 * useWriteContract / useWatchContractEvent hooks, e.g.:
 *
 *   useReadContract({ ...undoPayEscrowContract, functionName: "getPayment", args: [paymentId] })
 */
export const undoPayEscrowContract = {
  address: UNDOPAY_ESCROW_ADDRESS,
  abi: UNDOPAY_ESCROW_ABI,
} as const;

/** Alias for undoPayEscrowContract, in case other code expects this name. */
export const contractConfig = undoPayEscrowContract;

/**
 * Matches the PaymentStatus enum in UndoPayEscrow.sol.
 */
export enum PaymentStatus {
  Pending = 0,
  Reclaimed = 1,
  Released = 2,
}

/**
 * FIX: this was missing entirely, which is the actual bug —
 * PaymentCard.tsx imports it, got `undefined` back at runtime, and
 * `undefined[payment.status]` (payment.status === 0 for a fresh
 * Pending payment) throws exactly "Cannot read properties of
 * undefined (reading '0')".
 *
 * Keyed by the PaymentStatus enum so it can never drift out of sync
 * with the enum itself — add a new status there and TypeScript will
 * force you to add its label here too.
 */
export const PAYMENT_STATUS_LABELS: Record<
  PaymentStatus,
  "Pending" | "Reclaimed" | "Released"
> = {
  [PaymentStatus.Pending]: "Pending",
  [PaymentStatus.Reclaimed]: "Reclaimed",
  [PaymentStatus.Released]: "Released",
};

/**
 * Shape returned by getPayment(), with friendly field names.
 */
export interface Payment {
  sender: `0x${string}`;
  receiver: `0x${string}`;
  amount: bigint;
  createdAt: bigint;
  expiresAt: bigint;
  status: PaymentStatus;
}

/**
 * Converts the raw tuple returned by getPayment() into a typed
 * Payment object. wagmi returns struct-like return values as an
 * array in declaration order when there's no named ABI component.
 */
export function parsePaymentResult(
  result: readonly [
    `0x${string}`,
    `0x${string}`,
    bigint,
    bigint,
    bigint,
    number
  ]
): Payment {
  const [sender, receiver, amount, createdAt, expiresAt, status] = result;
  return {
    sender,
    receiver,
    amount,
    createdAt,
    expiresAt,
    status: status as PaymentStatus,
  };
}
