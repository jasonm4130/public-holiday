import { useEffect, useState } from "react";
import { differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  label: string;
}

export function useCountdown(targetDate: Date | null): Countdown | null {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) return null;

  const totalMinutes = differenceInMinutes(targetDate, now);
  if (totalMinutes < 0) return { days: 0, hours: 0, minutes: 0, label: "Today!" };

  const days = differenceInDays(targetDate, now);
  const hours = differenceInHours(targetDate, now) % 24;
  const minutes = totalMinutes % 60;

  let label: string;
  if (days === 0) label = "Today!";
  else if (days === 1) label = "Tomorrow!";
  else label = `${days} days away`;

  return { days, hours, minutes, label };
}
