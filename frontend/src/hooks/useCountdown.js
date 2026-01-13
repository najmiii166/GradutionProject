import { useEffect, useState } from "react";

export default function useCountdown(startTime) {
  const [state, setState] = useState({
    text: "",
    isStarted: false,
  });

  useEffect(() => {
    if (!startTime) return;

    const tick = () => {
      const now = new Date();
      const start = new Date(startTime);
      const diff = start - now;

      if (diff <= 0) {
        setState({ text: "Starting now", isStarted: true });
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setState({
        text: `${minutes}m ${seconds}s`,
        isStarted: false,
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return state;
}
