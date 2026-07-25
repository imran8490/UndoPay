"use client";

import { useReadContract } from "wagmi";
import { undoPayEscrowContract, parsePaymentResult } from "@/lib/contract";

/**
 * Reads a payment's details via getPayment(). Polls every 3s so the
 * status badge (Pending -> Reclaimed/Released) stays live without a
 * manual refresh, e.g. after someone else calls releasePayment().
 */
export function usePaymentDetails(paymentId: number | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    ...undoPayEscrowContract,
    functionName: "getPayment",
    args: paymentId !== undefined ? [BigInt(paymentId)] : undefined,
    query: {
      enabled: paymentId !== undefined,
      refetchInterval: 1500,
    },
  });

  const payment = data ? parsePaymentResult(data as any) : undefined;

  return { payment, isLoading, error, refetch };
}
