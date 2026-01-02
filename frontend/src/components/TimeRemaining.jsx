import React, { useEffect, useState } from 'react';

// monthsRemaining: integer
function formatRemaining(ms) {
  if (ms <= 0) return 'Expired';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const remDays = days % 30;
  return `${months} month(s) ${remDays} day(s)`;
}

export default function TimeRemaining({ expiryDate }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 60);
    return () => clearInterval(t);
  }, []);

  const expiry = expiryDate ? new Date(expiryDate) : null;
  if (!expiry) return <div className="text-sm text-slate-300">No enrollment</div>;
  const ms = expiry - now;
  return (
    <div className="text-sm">
      <div className="text-xs text-slate-400">Time remaining</div>
      <div className={`font-semibold ${ms <= 0 ? 'text-rose-400' : 'text-green-300'}`}>
        {formatRemaining(ms)}
      </div>
    </div>
  );
}
