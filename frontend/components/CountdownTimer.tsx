"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  expiresAt: number; // Unix timestamp (seconds)
}

export default function CountdownTimer({
  expiresAt,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(expiresAt - now, 0);
      setTimeLeft(remaining);
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="rounded-xl border border-yellow-500 bg-yellow-500/10 p-4 text-center">
      <p className="text-sm text-yellow-300">
        Reclaim Window
      </p>

      <h2 className="mt-2 text-3xl font-bold text-white">
        {String(minutes).padStart(2, "0")}:
        {String(seconds).padStart(2, "0")}
      </h2>

      {timeLeft === 0 && (
        <p className="mt-2 text-red-400">
          Reclaim window expired
        </p>
      )}
    </div>
  );
}
