import { useEffect, useState, useMemo } from "react";
import { format, isWeekend } from "date-fns";
import type { PublicHoliday, LeaveBlock, LeaveOption } from "../../types/holiday";
import { getUpcomingHolidays } from "../../services/holidays";
import { getLocationLabel } from "../../utils/countries";
import { optimizeLeave } from "../../services/leave-optimizer";

interface LeaveOptimizerProps {
  countryCode: string;
  countryName: string;
  regionCode?: string;
  onBack?: () => void;
}

export function LeaveOptimizer({ countryCode, countryName, regionCode }: LeaveOptimizerProps) {
  const [holidays, setHolidays] = useState<PublicHoliday[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leaveDays, setLeaveDays] = useState(10);
  const [numberOfBlocks, setNumberOfBlocks] = useState(1);

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

  const options = useMemo(() => {
    if (!holidays) return null;
    return optimizeLeave(holidays, leaveDays, undefined, numberOfBlocks);
  }, [holidays, leaveDays, numberOfBlocks]);

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
          <div className="bg-muted/20 mx-auto h-4 w-32 animate-pulse rounded" />
          <div className="bg-muted/20 mx-auto h-8 w-56 animate-pulse rounded" />
          <div className="bg-muted/10 mx-auto h-24 w-full max-w-md animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  const locationLabel = getLocationLabel(countryName, regionCode);

  return (
    <div className="animate-fade-in">
      <p className="text-muted mb-1 text-sm font-medium tracking-widest uppercase">
        {locationLabel}
      </p>
      <h1 className="text-fg mb-2 text-2xl font-bold">Optimize Your Leave</h1>
      <p className="text-muted mb-6 text-sm">
        Find the best days to take off for maximum consecutive time away
      </p>

      {/* Leave days input */}
      <div className="border-accent/10 bg-accent/5 mx-auto mb-4 max-w-xs rounded-xl border p-5">
        <label
          htmlFor="leave-days"
          className="text-muted mb-3 block text-xs font-bold tracking-wider uppercase"
        >
          Total leave days
        </label>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setLeaveDays((d) => Math.max(1, d - 1))}
            className="bg-muted/20 text-accent-fg hover:bg-muted/30 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-lg font-bold transition-colors"
          >
            −
          </button>
          <input
            id="leave-days"
            type="range"
            min={1}
            max={25}
            value={leaveDays}
            onChange={(e) => setLeaveDays(Number(e.target.value))}
            className="bg-muted/30 accent-accent h-2 flex-1 cursor-pointer appearance-none rounded-lg"
          />
          <button
            onClick={() => setLeaveDays((d) => Math.min(25, d + 1))}
            className="bg-muted/20 text-accent-fg hover:bg-muted/30 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-lg font-bold transition-colors"
          >
            +
          </button>
        </div>
        <div className="mt-2 text-center">
          <span className="text-3xl font-extrabold">{leaveDays}</span>
          <span className="text-muted ml-1 text-sm">day{leaveDays > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Number of holidays */}
      <div className="border-accent/10 bg-accent/5 mx-auto mb-8 max-w-xs rounded-xl border p-5">
        <span className="text-muted mb-3 block text-xs font-bold tracking-wider uppercase">
          Number of holidays
        </span>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setNumberOfBlocks(n)}
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                numberOfBlocks === n
                  ? "bg-accent text-ocean-deep"
                  : "bg-muted/20 text-muted hover:bg-muted/30"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-muted mt-2 text-center text-xs">
          {numberOfBlocks === 1
            ? "One big break"
            : `Split into ${numberOfBlocks} separate holidays`}
        </p>
      </div>

      {/* Results */}
      {options && options.length > 0 ? (
        <div className="space-y-6">
          {options.map((option, i) => (
            <OptionCard
              key={i}
              option={option}
              rank={i + 1}
              holidays={holidays}
              defaultExpanded={i === 0}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted">No optimization found for this configuration.</p>
      )}
    </div>
  );
}

function OptionCard({
  option,
  rank,
  holidays,
  defaultExpanded,
}: {
  option: LeaveOption;
  rank: number;
  holidays: PublicHoliday[];
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isSingleBlock = option.blocks.length === 1;

  return (
    <div
      className={`rounded-xl border transition-all ${
        rank === 1 ? "border-accent/30 bg-accent/5" : "border-fg/5 bg-fg/[0.02]"
      }`}
    >
      {/* Option header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
              rank === 1 ? "bg-accent text-ocean-deep" : "bg-muted/30 text-accent-fg"
            }`}
          >
            {rank}
          </span>
          <div>
            <div className="text-base font-bold sm:text-lg">
              {isSingleBlock ? (
                <>
                  {format(option.blocks[0]!.startDate, "d MMM")} –{" "}
                  {format(option.blocks[0]!.endDate, "d MMM")}
                </>
              ) : (
                <>{option.blocks.length} holidays</>
              )}
            </div>
            <div className="text-muted flex gap-3 text-xs">
              <span>
                <strong className="text-accent-fg">{option.totalLeaveDaysUsed}</strong> leave day
                {option.totalLeaveDaysUsed > 1 ? "s" : ""}
              </span>
              <span>→</span>
              <span>
                <strong className="text-accent-fg">{option.totalDaysOff}</strong> days off
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-accent-fg text-2xl font-extrabold">
              {option.overallEfficiency.toFixed(1)}x
            </div>
            <div className="text-muted text-[10px]">return</div>
          </div>
          <svg
            className={`text-muted h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded blocks */}
      {expanded && (
        <div className="animate-fade-in border-fg/5 border-t px-5 pb-5">
          {option.blocks.map((block, i) => (
            <BlockDetail
              key={i}
              block={block}
              holidays={holidays}
              showHeader={!isSingleBlock}
              index={i + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BlockDetail({
  block,
  holidays,
  showHeader,
  index,
}: {
  block: LeaveBlock;
  holidays: PublicHoliday[];
  showHeader: boolean;
  index: number;
}) {
  return (
    <div className="pt-4">
      {showHeader && (
        <div className="mb-2 flex items-center gap-2">
          <span className="bg-muted/20 text-accent-fg inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
            {index}
          </span>
          <span className="text-sm font-bold">
            {format(block.startDate, "d MMM")} – {format(block.endDate, "d MMM")}
          </span>
          <span className="text-muted text-xs">
            {block.leaveDaysUsed} leave day{block.leaveDaysUsed > 1 ? "s" : ""} →{" "}
            {block.totalDaysOff} days off
          </span>
        </div>
      )}

      {/* Mini calendar */}
      <div className="mb-3 flex flex-wrap gap-1">
        {getDaysInBlock(block, holidays).map((day) => (
          <div
            key={day.date.toISOString()}
            title={`${format(day.date, "EEE d MMM")} — ${day.label}`}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
              day.type === "holiday"
                ? "bg-accent text-ocean-deep"
                : day.type === "leave"
                  ? "bg-accent/30 text-fg"
                  : day.type === "weekend"
                    ? "bg-muted/30 text-muted"
                    : "bg-fg/5 text-fg/30"
            }`}
          >
            {format(day.date, "d")}
          </div>
        ))}
      </div>

      <div className="text-muted flex flex-wrap gap-3 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="bg-accent inline-block h-3 w-3 rounded" /> Holiday
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-accent/30 inline-block h-3 w-3 rounded" /> Leave
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-muted/30 inline-block h-3 w-3 rounded" /> Weekend
        </span>
      </div>

      {block.holidays.length > 0 && (
        <p className="text-muted mt-3 text-xs">
          Includes: {block.holidays.map((h) => h.localName).join(", ")}
        </p>
      )}
    </div>
  );
}

interface DayInfo {
  date: Date;
  type: "holiday" | "leave" | "weekend" | "workday";
  label: string;
}

function getDaysInBlock(block: LeaveBlock, holidays: PublicHoliday[]): DayInfo[] {
  const days: DayInfo[] = [];
  const current = new Date(block.startDate);
  const end = block.endDate;

  while (current <= end) {
    const d = new Date(current);
    const holiday = holidays.find((h) => h.date.getTime() === d.getTime());
    const isLeave = block.leaveDates.some((ld) => ld.getTime() === d.getTime());

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
