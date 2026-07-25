"use client";

interface Props {
  disabled?: boolean;
  onClick: () => void;
}

export default function ReleaseButton({ disabled, onClick }: Props) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-600"
    >
      Release funds
    </button>
  );
}
