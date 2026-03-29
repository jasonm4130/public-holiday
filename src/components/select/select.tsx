import type { AustralianStateCode } from "../../types/holiday";
import { AUSTRALIAN_STATES } from "../../utils/states";

interface StateSelectProps {
  onSelect: (code: AustralianStateCode) => void;
  detectedState: AustralianStateCode | null;
  detecting: boolean;
}

export function StateSelect({ onSelect, detectedState, detecting }: StateSelectProps) {
  const detectedInfo = detectedState
    ? AUSTRALIAN_STATES.find((s) => s.code === detectedState)
    : null;

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="mb-6 flex justify-center">
        <img src="/logo.svg" alt="Public Holiday" className="h-20 w-20 drop-shadow-lg" />
      </div>

      <h1 className="mb-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
        Your next public holiday
      </h1>
      <p className="mb-8 text-lg text-brand-white/70">
        Find it instantly. Optimise your leave.
      </p>

      {/* Auto-detected state suggestion */}
      {detecting && (
        <div className="mx-auto mb-6 max-w-sm animate-pulse text-sm text-brand-grey">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-grey border-t-brand-yellow" />{" "}
          Detecting your location…
        </div>
      )}

      {detectedInfo && !detecting && (
        <button
          onClick={() => onSelect(detectedState!)}
          className="mx-auto mb-6 flex cursor-pointer items-center gap-3 rounded-xl border border-brand-yellow/20 bg-brand-yellow/5 px-6 py-4 transition-all hover:border-brand-yellow/40 hover:bg-brand-yellow/10"
        >
          <svg className="h-5 w-5 text-brand-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="text-left">
            <div className="text-xs text-brand-grey">It looks like you're in</div>
            <div className="font-bold text-brand-yellow">{detectedInfo.name}</div>
          </div>
          <svg className="ml-2 h-4 w-4 text-brand-grey" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* State selector */}
      <div className="mx-auto max-w-sm">
        <label className="mb-2 block text-left text-xs font-medium text-brand-grey uppercase tracking-wider">
          {detectedInfo ? "Or select a different state" : "Select your state"}
        </label>
        <div className="relative">
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                onSelect(e.target.value as AustralianStateCode);
              }
            }}
            className="h-12 w-full cursor-pointer appearance-none rounded-lg bg-brand-white
                       pr-10 pl-4 text-sm text-brand-black shadow-lg outline-none
                       transition-shadow focus:ring-2 focus:ring-brand-yellow focus:shadow-brand-yellow/20"
          >
            <option value="" disabled>
              Choose state or territory…
            </option>
            {AUSTRALIAN_STATES.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg bg-brand-yellow">
            <svg
              className="h-4 w-4 text-brand-black"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-md text-center text-sm leading-relaxed text-brand-white/50">
        <p>
          See your next public holiday instantly, or use the{" "}
          <strong className="text-brand-yellow/80">Leave Optimizer</strong> to
          find the best days to take off for maximum time away.
        </p>
      </div>
    </div>
  );
}
