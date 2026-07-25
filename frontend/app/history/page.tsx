"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePublicClient } from "wagmi";
import { useWallet } from "@/hooks/useWallet";
import { undoPayEscrowContract } from "@/lib/contract";

interface HistoryEntry {
  paymentId: bigint;
  receiver: `0x${string}`;
  amount: bigint;
}

export default function HistoryPage() {
  const { address, isConnected } = useWallet();
  const publicClient = usePublicClient();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !publicClient) return;

    setIsLoading(true);
    publicClient
      .getContractEvents({
        ...undoPayEscrowContract,
        eventName: "PaymentCreated",
        args: { sender: address },
        fromBlock: "earliest",
        toBlock: "latest",
      })
      .then((logs) => {
        const parsed = logs
          .map((log: any) => ({
            paymentId: log.args.paymentId as bigint,
            receiver: log.args.receiver as `0x${string}`,
            amount: log.args.amount as bigint,
          }))
          .reverse(); // newest first
        setEntries(parsed);
      })
      .catch((err) => console.error("Failed to load history:", err))
      .finally(() => setIsLoading(false));
  }, [address, publicClient]);

  return (
    <main className="min-h-screen bg-[#0B1120] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-gray-400 hover:text-white">
          ← Back to home
        </Link>

        <h1 className="mb-8 mt-4 text-3xl font-bold">Payment history</h1>

        {!isConnected && (
          <p className="text-gray-400">Connect your wallet to see your payments.</p>
        )}

        {isConnected && isLoading && <p className="text-gray-400">Loading...</p>}

        {isConnected && !isLoading && entries.length === 0 && (
          <p className="text-gray-400">No payments yet.</p>
        )}

        <div className="space-y-3">
          {entries.map((entry) => (
            <Link
              key={entry.paymentId.toString()}
              href={`/payment/${entry.paymentId}`}
              className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4 transition hover:border-blue-500"
            >
              <span>Payment #{entry.paymentId.toString()}</span>
              <span className="text-sm text-gray-400">
                To {entry.receiver.slice(0, 6)}...{entry.receiver.slice(-4)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
