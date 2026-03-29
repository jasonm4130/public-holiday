import { useEffect, useState, useMemo } from "react";
import { format, isWeekend } from "date-fns";
import type { AustralianStateCode, PublicHoliday, LeaveBlock } from "../../types/holiday";
import { getUpcomingHolidays } from "../../services/holidays";
import { getStateByCode } from "../../utils/states";
import { optimizeLeave } from "../../services/leave-optimizer";

interface LeaveOptimizerProps {
  stateCode: AustralianStateCode;
  onBack?: () => void;
}

export function LeaveOptimizer({ stateCode }: LeaveOptimizerProps) {
  const [holidays, setHolidays] = useState<PublicHoliday[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leaveDays, setLeaveDays] = useState(3);

  useEffect(() => {
    let cancelled = false;
    setHolidays(null);
    setError(null);

    getUpcomingHolidays(stateCode)
      .then((data) => {
        if (!cancelled) setHolidays(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load holidays");
      });

    return () => {
      cancelled = true;
    };
  }, [stateCode]);

  const results = useMemo(() => {
    if (!holidays) return null;
    return optimizeLeave(holidays, leaveDays);
  }, [holidays, leaveDays]);

  if (error) {
    return (
      <div className="animate-fade-in">
        <div className="mx-auto mb-6 max-w-sm rounded-lg border border-red-400/20 bg-red-400/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!holidays) {
    return (
      <div className="animate-fade-in">
        <div className="space-y-4">
          <div className="mx-auto h-4 w-32 animate-pulse rounded bg-brand-grey/20" />
          <div className="mx-auto h-8 w-56 animate-pulse rounded bg-brand-grey/20" />
          <div className="mx-auto h-24 w-full max-w-md animate-pulse rounded-xl bg-brand-grey/10" />
        </div>
      </div>
    );
  }

  const stateName = getStateByCode(stateCode).name;

  return (
    <div className="animate-fade-in">
      <p className="mb-1 text-sm font-medium tracking-widest text-brand-grey uppercase">
        {stateName}
      </p>
      <h1 className="mb-2 text-2xl font-bold text-brand-white/80">Optimize Your Leave</h1>
      <p className="mb-6 text-sm text-brand-white/50">
        Find the best days to take off for maximum consecutive time away
      </p>

      {/* Leave days input */}
      <div className="mx-auto mb-8 max-w-xs rounded-xl border border-brand-yellow/10 bg-brand-yellow/5 p-5">
        <label
          htmlFor="leave-days"
          className="mb-3 block text-xs font-bold tracking-wider text-brand-grey uppercase"
        >
          Available leave days
        </label>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setLeaveDays((d) => Math.max(1, d - 1))}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-brand-grey/20 text-lg font-bold text-brand-yellow transition-colors hover:bg-brand-grey/30"
          >
            −
          </button>
          <input
            id="leave-days"
            type="range"
            min={1}
            max={15}
            value={leaveDays}
            onChange={(e) => setLeaveDays(Number(e.target.value))}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-brand-grey/30 accent-brand-yellow"
          />
          <button
            onClick={() => setLeaveDays((d) => Math.min(15, d + 1))}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-brand-grey/20 text-lg font-bold text-brand-yellow transition-colors hover:bg-brand-grey/30"
          >
            +
          </button>
        </div>
        <div className="mt-2 text-center">
          <span className="text-3xl font-extrabold">{leaveDays}</span>
          <span className="ml-1 text-sm text-brand-grey">day{leaveDays > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Results */}
      {results && results.length > 0 ? (
        <div className="space-y-4">
          {results.map((block, i) => (
            <LeaveBlockCard key={i} block={block} rank={i + 1} holidays={holidays} />
          ))}
        </div>
      ) : (
        <p className="text-brand-white/60">No optimization found for this configuration.</p>
      )}
    </div>
  );
}

function LeaveBlockCard({
  block,
  rank,
  holidays,
}: {
  block: LeaveBlock;
  rank: number;
  holidays: PublicHoliday[];
}) {
  const [expanded, setExpanded] = useState(rank === 1);

  return (
    <div
      className={`rounded-xl border transition-all ${
        rank === 1
          ? "border-brand-yellow/30 bg-brand-yellow/5"
          : "border-brand-white/5 bg-brand-white/[0.02]"
      } p-5 text-left`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-start justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            rank === 1
              ? "bg-brand-yellow text-brand-black"
              : "bg-brand-grey/30 text-brand-yellow"
          }`}>
            {rank}
          </span>
          <div>
            <div className="text-base font-bold sm:text-lg">
              {format(block.startDate, "d MMM")} – {format(block.endDate, "d MMM")}
            </div>
            <div className="flex gap-3 text-xs text-brand-grey">
              <span>
                <strong className="text-brand-yellow">{block.leaveDaysUsed}</strong> leave day{block.leaveDaysUsed > 1 ? "s" : ""}
              </span>
              <span>→</span>
              <span>
                <strong className="text-brand-yellow">{block.totalDaysOff}</strong> days off
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-extrabold ${rank === 1 ? "text-brand-yellow" : "text-brand-yellow/70"}`}>
            {block.efficiency.toFixed(1)}x
          </div>
          <div className="text-[10px] text-brand-grey">return</div>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 animate-fade-in">
          {/* Mini calendar */}
          <div className="mb-3 flex flex-wrap gap-1">
            {getDaysInBlock(block, holidays).map((day) => (
              <div
                key={day.date.toISOString()}
                title={`${format(day.date, "EEE d MMM")} — ${day.label}`}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  day.type === "holiday"
                    ? "bg-brand-yellow text-brand-black"
                    : day.type === "leave"
                      ? "bg-brand-yellow/30 text-brand-white"
                      : day.type === "weekend"
                        ? "bg-brand-grey/30 text-brand-white/60"
                        : "bg-brand-white/5 text-brand-white/30"
                }`}
              >
                {format(day.date, "d")}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 text-[11px] text-brand-grey">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-brand-yellow" /> Holiday
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-brand-yellow/30" /> Leave
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-brand-grey/30" /> Weekend
            </span>
          </div>

          {block.holidays.length > 0 && (
            <p className="mt-3 text-xs text-brand-white/50">
              Includes: {block.holidays.map((h) => h.localName).join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface DayInfo {
  date: Date;
  type: "holiday" | "leave" | "weekend" | "workday";
  label: string;
}

function getDaysInBlock(
  block: LeaveBlock,
  holidays: PublicHoliday[]
): DayInfo[] {
  const days: DayInfo[] = [];
  const current = new Date(block.startDate);
  const end = block.endDate;

  while (current <= end) {
    const d = new Date(current);
    const holiday = holidays.find(
      (h) => h.date.getTime() === d.getTime()
    );
    const isLeave = block.leaveDates.some(
      (ld) => ld.getTime() === d.getTime()
    );

    let type: DayInfo["type"];
    let label: string;

    if (holiday) {
      type = "holiday";
      label = holiday.localName;
    } else if (isLeave) {
      type = "leave";
      label = "Leave day";
    } else if (isWeekend(d)) {
      type = "weekend";
      label = "Weekend";
    } else {
      type = "workday";
      label = "Work day";
    }

    days.push({ date: d, type, label });
    current.setDate(current.getDate() + 1);
  }

  return days;
}
