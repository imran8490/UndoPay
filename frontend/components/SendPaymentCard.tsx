"use client";

import { useState } from "react";
import Link from "next/link";
import { useCreatePayment } from "@/hooks/usePayment";
import { useWallet } from "@/hooks/useWallet";

export default function SendPaymentCard() {
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");

  const { isConnected, isWrongNetwork } = useWallet();
  const {
    createPayment,
    isSubmitting,
    isConfirming,
    isConfirmed,
    error,
    hash,
    paymentId,
    reset,
  } = useCreatePayment();

  const isBusy = isSubmitting || isConfirming;

  function handleCreatePayment() {
    createPayment(receiver, amount);
  }

  function handleReset() {
    setReceiver("");
    setAmount("");
    reset();
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-bold text-white">Create escrow payment</h2>

      {isConfirmed ? (
        <div className="space-y-4">
          <p className="text-emerald-400">
            Payment created. It will be reclaimable for 30 seconds, then auto-releases.
          </p>
          {hash && (
            <a
              href={`https://testnet.arcscan.app/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-400 underline"
            >
              View on Arcscan
            </a>
          )}
          {paymentId !== undefined && (
            <Link
              href={`/payment/${paymentId}`}
              className="block w-full rounded-xl bg-blue-600 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
            >
              View payment #{paymentId.toString()}
            </Link>
          )}
          <button
            onClick={handleReset}
            className="w-full rounded-xl bg-gray-800 py-3 font-semibold text-white transition hover:bg-gray-700"
          >
            Send another payment
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="mb-2 block text-sm text-gray-400">Receiver address</label>
            <input
              type="text"
              placeholder="0x..."
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              disabled={isBusy}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm text-gray-400">Amount (USDC)</label>
            <input
              type="number"
              placeholder="0.01"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isBusy}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </div>

          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

          {!isConnected && (
            <p className="mb-4 text-sm text-amber-400">Connect your wallet first.</p>
          )}
          {isWrongNetwork && (
            <p className="mb-4 text-sm text-amber-400">Switch to Arc Testnet first.</p>
          )}

          <button
            onClick={handleCreatePayment}
            disabled={!isConnected || isWrongNetwork || isBusy}
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Confirm in wallet..."
              : isConfirming
              ? "Creating payment..."
              : "Create escrow payment"}
          </button>
        </>
      )}
    </div>
  );
}
