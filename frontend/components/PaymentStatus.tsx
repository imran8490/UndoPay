"use client";

interface Props {
  status: "Pending" | "Released" | "Reclaimed";
}

export default function PaymentStatus({ status }: Props) {
  const color =
    status === "Pending"
      ? "bg-yellow-500"
      : status === "Released"
      ? "bg-green-500"
      : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="font-medium text-white">
        {status}
      </span>
    </div>
  );
}
