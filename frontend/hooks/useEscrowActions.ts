"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { undoPayEscrowContract } from "@/lib/contract";

/**
 * Shared shape for reclaimPayment / releasePayment — both are simple
 * single-arg (paymentId) writes with the same pending/confirming/
 * confirmed lifecycle, so one hook factory covers both.
 */
function useEscrowAction(functionName: "reclaimPayment" | "releasePayment") {
  const {
    writeContract,
    data: hash,
    isPending: isSubmitting,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  function execute(paymentId: number) {
    writeContract({
      ...undoPayEscrowContract,
      functionName,
      args: [BigInt(paymentId)],
    });
  }

  return {
    execute,
    hash,
    isSubmitting,
    isConfirming,
    isConfirmed,
    error: writeError?.message ?? receiptError?.message ?? null,
    reset,
  };
}

export function useReclaimPayment() {
  const { execute, ...rest } = useEscrowAction("reclaimPayment");
  return { reclaim: execute, ...rest };
}

export function useReleasePayment() {
  const { execute, ...rest } = useEscrowAction("releasePayment");
  return { release: execute, ...rest };
}
