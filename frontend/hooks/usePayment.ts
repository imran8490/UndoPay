"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, isAddress, decodeEventLog } from "viem";
import { undoPayEscrowContract } from "@/lib/contract";

/**
 * Handles creating a new escrow payment (createPayment on-chain call).
 * Amount is in USDC, which is Arc's native gas token (18 decimals),
 * so it's sent as msg.value just like ETH would be on other chains.
 */
export function useCreatePayment() {
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    writeContract,
    data: hash,
    isPending: isSubmitting,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  // createPayment's return value isn't directly readable from a write
  // call — decode it from the PaymentCreated event in the receipt logs
  // instead, so the UI can redirect to /payment/{id} after creation.
  let paymentId: bigint | undefined;
  if (receipt) {
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: undoPayEscrowContract.abi,
          eventName: "PaymentCreated",
          data: log.data,
          topics: log.topics,
        });
        paymentId = (decoded.args as unknown as { paymentId: bigint }).paymentId;
        break;
      } catch {
        // Not the event we're looking for — skip.
        continue;
      }
    }
  }

  function createPayment(receiver: string, amountUsdc: string) {
    setValidationError(null);

    if (!isAddress(receiver)) {
      setValidationError("Enter a valid receiver address");
      return;
    }

    const amountNumber = Number(amountUsdc);
    if (!amountUsdc || Number.isNaN(amountNumber) || amountNumber <= 0) {
      setValidationError("Enter an amount greater than 0");
      return;
    }

    writeContract({
      ...undoPayEscrowContract,
      functionName: "createPayment",
      args: [receiver as `0x${string}`],
      value: parseUnits(amountUsdc, 18), // USDC on Arc uses 18 decimals
    });
  }

  return {
    createPayment,
    hash,
    paymentId,
    isSubmitting,
    isConfirming,
    isConfirmed,
    error: validationError ?? writeError?.message ?? receiptError?.message ?? null,
    reset,
  };
}
