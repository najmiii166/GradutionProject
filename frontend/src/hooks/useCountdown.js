// src/hooks/useCountdown.js
import { useEffect, useState } from "react";

export default function useCountdown(startTime) {
  const [state, setState] = useState({
    text: "",
    isStarted: false,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!startTime) return;

    const tick = () => {
      const now = new Date();
      const start = new Date(startTime);
      const diff = start - now;

      if (diff <= 0) {
        setState({ text: "Expired", isStarted: true, days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let timeText = "";
      
      // If less than 1 hour (0 days AND 0 hours), show minutes and seconds
      if (days === 0 && hours === 0) {
        timeText = `${minutes}m ${seconds}s`;
      } else {
        // Otherwise show Days, Hours, Minutes
        if (days > 0) timeText += `${days}d `;
        timeText += `${hours}h ${minutes}m`;
      }

      setState({
        text: timeText.trim(),
        isStarted: false,
        days,
        hours,
        minutes,
        seconds
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return state;
}