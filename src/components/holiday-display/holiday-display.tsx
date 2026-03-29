import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { PublicHoliday } from "../../types/holiday";
import { getUpcomingHolidays } from "../../services/holidays";
import { getLocationLabel } from "../../utils/countries";
import { useCountdown } from "../../hooks/useCountdown";

interface HolidayDisplayProps {
  countryCode: string;
  countryName: string;
  regionCode?: string;
  onBack: () => void;
}

export function HolidayDisplay({
  countryCode,
  countryName,
  regionCode,
  onBack,
}: HolidayDisplayProps) {
  const [holidays, setHolidays] = useState<PublicHoliday[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHolidays(null); // eslint-disable-line react-hooks/set-state-in-effect -- intentional reset on dep change
    setError(null);

    getUpcomingHolidays(countryCode, regionCode)
      .then((data) => {
        if (!cancelled) setHolidays(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load holidays");
      });

    return () => {
      cancelled = true;
    };
  }, [countryCode, regionCode]);

  const nextHoliday = holidays?.[0] ?? null;
  const countdown = useCountdown(nextHoliday?.date ?? null);

  const locationLabel = getLocationLabel(countryName, regionCode);

  if (error) {
    return (
      <div className="animate-fade-in">
        <div className="mx-auto mb-6 max-w-sm rounded-lg border border-red-400/20 bg-red-400/10 p-4">
          <p className="text-sm text-red-400">Something went wrong: {error}</p>
        </div>
        <BackButton onClick={onBack} />
      </div>
    );
  }

  if (!holidays) {
    return (
      <div className="animate-fade-in">
        <LoadingSkeleton />
      </div>
    );
  }

  if (holidays.length === 0) {
    return (
      <div className="animate-fade-in">
        <p className="mb-4 text-xl">No upcoming public holidays found.</p>
        <BackButton onClick={onBack} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <p className="text-muted mb-1 text-sm font-medium tracking-widest uppercase">
        {locationLabel}
      </p>
      <h1 className="text-fg/80 mb-4 text-2xl font-bold">Your next holiday</h1>

      {/* Countdown */}
      {countdown && (
        <div className="mb-4">
          {countdown.days === 0 ? (
            <div className="text-accent-fg text-3xl font-extrabold">🎉 It's today!</div>
          ) : (
            <div className="flex justify-center gap-3">
              <CountdownUnit value={countdown.days} label="days" />
              <CountdownUnit value={countdown.hours} label="hrs" />
              <CountdownUnit value={countdown.minutes} label="min" />
            </div>
          )}
        </div>
      )}

      {/* Next holiday */}
      <div className="border-accent/20 bg-accent/5 mb-2 rounded-xl border p-6">
        <h2 className="mb-1 text-4xl font-extrabold sm:text-5xl">
          {format(nextHoliday!.date, "EEE do MMM")}
        </h2>
        <p className="text-muted text-sm">{format(nextHoliday!.date, "yyyy")}</p>
        <h3 className="text-fg/90 mt-3 text-2xl font-bold">{nextHoliday!.localName}</h3>
      </div>

      {/* Upcoming list */}
      {holidays.length > 1 && (
        <div className="mx-auto mt-8 max-w-md">
          <h4 className="text-muted mb-3 text-xs font-bold tracking-widest uppercase">Coming up</h4>
          <ul className="space-y-1.5 text-left">
            {holidays.slice(1, 8).map((h) => (
              <li
                key={h.date.toISOString() + h.name}
                className="bg-fg/5 hover:bg-fg/8 flex items-center justify-between rounded-lg px-4 py-2.5 transition-colors"
              >
                <span className="text-fg/90 text-sm">{h.localName}</span>
                <span className="text-muted text-xs font-medium">
                  {format(h.date, "EEE d MMM")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-accent/10 text-accent-fg flex h-16 w-16 items-center justify-center rounded-xl text-3xl font-extrabold tabular-nums sm:h-20 sm:w-20 sm:text-4xl">
        {value}
      </div>
      <span className="text-muted mt-1 text-xs font-medium">{label}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-muted/20 mx-auto h-4 w-32 animate-pulse rounded" />
      <div className="bg-muted/20 mx-auto h-8 w-48 animate-pulse rounded" />
      <div className="bg-muted/10 mx-auto h-16 w-64 animate-pulse rounded-xl" />
      <div className="bg-muted/20 mx-auto h-6 w-40 animate-pulse rounded" />
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-muted/20 text-accent-fg hover:bg-muted/30 cursor-pointer rounded-lg px-5 py-2.5 text-sm font-bold transition-all hover:shadow-lg"
    >
      ← Change location
    </button>
  );
}
