import { useState, useEffect } from "react";
import type { AustralianStateCode } from "./types/holiday";
import { StateSelect } from "./components/select/select";
import { HolidayDisplay } from "./components/holiday-display/holiday-display";
import { LeaveOptimizer } from "./components/leave-optimizer/leave-optimizer";
import { detectState } from "./services/geolocation";
import { getUpcomingHolidays } from "./services/holidays";

function getInitialState(): AustralianStateCode | null {
  const hash = window.location.hash.slice(1).toUpperCase();
  const valid: AustralianStateCode[] = [
    "ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA",
  ];
  return valid.includes(hash as AustralianStateCode)
    ? (hash as AustralianStateCode)
    : null;
}

export default function App() {
  const [selectedState, setSelectedState] = useState<AustralianStateCode | null>(
    getInitialState
  );
  const [detectedState, setDetectedState] = useState<AustralianStateCode | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [activeTab, setActiveTab] = useState<"next" | "optimize">("next");

  // Auto-detect state on mount if none selected
  useEffect(() => {
    if (selectedState) return;
    setDetecting(true);
    detectState()
      .then((result) => {
        if (result) {
          setDetectedState(result.state);
          // Prefetch holidays for detected state
          getUpcomingHolidays(result.state).catch(() => {});
        }
      })
      .finally(() => setDetecting(false));
  }, [selectedState]);

  // Prefetch holidays when state is selected
  useEffect(() => {
    if (selectedState) {
      getUpcomingHolidays(selectedState).catch(() => {});
    }
  }, [selectedState]);

  function handleSelectState(code: AustralianStateCode) {
    setSelectedState(code);
    window.location.hash = code;
  }

  function handleBack() {
    setSelectedState(null);
    setActiveTab("next");
    window.history.replaceState(null, "", " ");
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-brand-black text-brand-yellow">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <button
          onClick={handleBack}
          className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80"
        >
          <img src="/logo.svg" alt="" className="h-8 w-8" />
          <span className="text-sm font-bold tracking-wide">
            My Next <span className="text-brand-yellow">Public Holiday</span>
          </span>
        </button>
        {selectedState && (
          <button
            onClick={handleBack}
            className="cursor-pointer text-xs font-medium text-brand-grey transition-colors hover:text-brand-yellow"
          >
            Change state
          </button>
        )}
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-2xl text-center">
          <div
            className="transition-opacity duration-300"
            style={{ opacity: 1 }}
          >
            {!selectedState ? (
              <StateSelect
                onSelect={handleSelectState}
                detectedState={detectedState}
                detecting={detecting}
              />
            ) : (
              <>
                {/* Tab navigation */}
                <div className="mb-8 flex justify-center gap-1">
                  <button
                    onClick={() => setActiveTab("next")}
                    className={`cursor-pointer rounded-t-lg px-6 py-3 text-sm font-bold transition-colors ${
                      activeTab === "next"
                        ? "bg-brand-yellow text-brand-black"
                        : "bg-brand-grey/30 text-brand-yellow hover:bg-brand-grey/50"
                    }`}
                  >
                    Next Holiday
                  </button>
                  <button
                    onClick={() => setActiveTab("optimize")}
                    className={`cursor-pointer rounded-t-lg px-6 py-3 text-sm font-bold transition-colors ${
                      activeTab === "optimize"
                        ? "bg-brand-yellow text-brand-black"
                        : "bg-brand-grey/30 text-brand-yellow hover:bg-brand-grey/50"
                    }`}
                  >
                    Optimize Leave
                  </button>
                </div>

                {activeTab === "next" ? (
                  <HolidayDisplay stateCode={selectedState} onBack={handleBack} />
                ) : (
                  <LeaveOptimizer stateCode={selectedState} onBack={handleBack} />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-4 text-center text-xs text-brand-grey/60">
        Holiday data from{" "}
        <a
          href="https://date.nager.at/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline transition-colors hover:text-brand-grey"
        >
          Nager.Date API
        </a>
        {" · "}
        Open source on{" "}
        <a
          href="https://github.com/jasonm4130/public-holiday"
          target="_blank"
          rel="noopener noreferrer"
          className="underline transition-colors hover:text-brand-grey"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
