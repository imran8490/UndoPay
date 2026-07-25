"use client";

interface Props {
  disabled?: boolean;
  onClick: () => void;
}

export default function ReclaimButton({
  disabled,
  onClick,
}: Props) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-600"
    >
      Reclaim Funds
    </button>
  );
}
