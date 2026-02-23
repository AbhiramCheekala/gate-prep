"use client";

import { useEffect, useState } from "react";

export function TimerBar({ durationMins, onTimeUp }: { durationMins: number, onTimeUp: () => void }) {
  const [seconds, setSeconds] = useState(durationMins * 60);

  useEffect(() => {
    if (seconds <= 0) {
      onTimeUp();
      return;
    }
    const timer = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds, onTimeUp]);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return (
    <div className={`px-4 py-2 font-mono text-xl font-bold ${seconds < 300 ? 'text-red-600 animate-pulse' : 'text-[#003087]'}`}>
      Time Left: {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
    </div>
  );
}
