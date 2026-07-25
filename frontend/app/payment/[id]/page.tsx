"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import PaymentCard from "@/components/PaymentCard";

export default function PaymentPage() {
  const params = useParams();
  const idParam = params?.id;
  const paymentId = Number(Array.isArray(idParam) ? idParam[0] : idParam);

  const isValidId = Number.isInteger(paymentId) && paymentId > 0;

  return (
    <main className="min-h-screen bg-[#0B1120] px-6 py-16 text-white">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6">
        <Link href="/" className="self-start text-sm text-gray-400 hover:text-white">
          ← Back to home
        </Link>

        {isValidId ? (
          <PaymentCard paymentId={paymentId} />
        ) : (
          <p className="text-red-400">Invalid payment id.</p>
        )}
      </div>
    </main>
  );
}
