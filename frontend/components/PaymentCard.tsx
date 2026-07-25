"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import CountdownTimer from "./CountdownTimer";
import ReclaimButton from "./ReclaimButton";
import PaymentStatus from "./PaymentStatus";
import { usePaymentDetails } from "@/hooks/usePaymentDetails";
import { useReclaimPayment, useReleasePayment } from "@/hooks/useEscrowActions";
import { PaymentStatus as Status, PAYMENT_STATUS_LABELS } from "@/lib/contract";

interface Props {
  paymentId: number;
}

export default function PaymentCard({ paymentId }: Props) {
  const { address, isConnected } = useAccount();
  const { payment, isLoading, error, refetch } = usePaymentDetails(paymentId);

  // FIX (hydration): start as null on both server and first client
  // render — they now match exactly. The real clock value only gets set
  // inside useEffect, which runs after hydration, so React updates the
  // DOM on the client instead of complaining about a mismatch. Never
  // seed useState with Date.now()/Math.random() when the value affects
  // what gets rendered.
  const [nowSeconds, setNowSeconds] = useState<number | null>(null);
  useEffect(() => {
    setNowSeconds(Math.floor(Date.now() / 1000));
    const interval = setInterval(() => {
      setNowSeconds(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const {
    reclaim,
    isSubmitting: isReclaiming,
    isConfirming: isConfirmingReclaim,
    isConfirmed: reclaimConfirmed,
    error: reclaimError,
  } = useReclaimPayment();

  const {
    release,
    isSubmitting: isReleasing,
    isConfirming: isConfirmingRelease,
    isConfirmed: releaseConfirmed,
    error: releaseError,
  } = useReleasePayment();

  // Refetch payment details once either action confirms, so the
  // status badge updates without a manual page reload.
  if (reclaimConfirmed || releaseConfirmed) {
    refetch();
  }

  const isPending = payment?.status === Status.Pending;
  const expiresAtSeconds = payment ? Number(payment.expiresAt) : 0;
  // nowSeconds is null until the client clock is set (post-hydration) —
  // treat "unknown yet" as "not expired" rather than crashing/flashing.
  const isExpired =
    nowSeconds !== null && expiresAtSeconds > 0 && nowSeconds >= expiresAtSeconds;

  // Auto-release the second the reclaim window expires — no manual
  // button. Requires a connected wallet with this page open, since a
  // contract call always needs someone to sign it; whichever wallet
  // (sender's or receiver's) has this page open when the timer hits
  // 0 triggers it.
  const hasTriggeredRelease = useRef(false);
  useEffect(() => {
    if (
      isPending &&
      isExpired &&
      !hasTriggeredRelease.current &&
      !isReleasing &&
      !isConfirmingRelease &&
      !isReclaiming &&
      !isConfirmingReclaim &&
      !reclaimConfirmed
    ) {
      hasTriggeredRelease.current = true;
      release(paymentId);
    }
  }, [isPending, isExpired, isReleasing, isConfirmingRelease, isReclaiming, isConfirmingReclaim, reclaimConfirmed, paymentId, release]);

  if (isLoading) {
    return (
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 p-6 text-gray-400">
        Loading payment...
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 p-6 text-red-400">
        Payment not found.
      </div>
    );
  }

  const isSender =
    !!payment.sender && address?.toLowerCase() === payment.sender.toLowerCase();

  // FIX (crash): payment.status might not match a key in
  // PAYMENT_STATUS_LABELS — wrong field name from the contract read,
  // a stale/partial object mid-fetch, or an enum value that doesn't
  // exist yet on this deployment. Fall back instead of throwing.
  // If this fallback is actually firing, the real bug is a mismatch
  // between what usePaymentDetails() returns and what lib/contract.ts
  // expects — worth checking those two files directly.
  const statusLabel = (PAYMENT_STATUS_LABELS[payment.status] ?? "Pending") as
    | "Pending"
    | "Reclaimed"
    | "Released";

  return (
    <div className="w-full max-w-lg space-y-4 rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Payment #{paymentId}</h2>
        <PaymentStatus status={statusLabel} />
      </div>

      <div className="space-y-1 text-sm text-gray-400">
        <p>From: {payment.sender}</p>
        <p>To: {payment.receiver}</p>
        <p className="text-white">
          Amount: {formatUnits(payment.amount, 18)} USDC
        </p>
      </div>

      {isPending && !isExpired && !reclaimConfirmed && (
<CountdownTimer expiresAt={expiresAtSeconds} onExpire={() => setLocalExpired(true)} />
)}

      {isPending && isExpired && (isReleasing || isConfirmingRelease) && (
        <p className="text-sm text-emerald-400">Releasing funds to receiver...</p>
      )}

      {(reclaimError || releaseError) && (
        <p className="text-sm text-red-400">{reclaimError ?? releaseError}</p>
      )}

      {isPending && isSender && (
        <ReclaimButton
          disabled={isExpired || isReclaiming || isConfirmingReclaim}
          onClick={() => reclaim(paymentId)}
        />
      )}
    </div>
  );
}
