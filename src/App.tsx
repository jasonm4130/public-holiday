import { useState, useEffect } from "react";
import type { HolidayLocation } from "./types/holiday";
import { LocationSelect } from "./components/select/select";
import { HolidayDisplay } from "./components/holiday-display/holiday-display";
import { LeaveOptimizer } from "./components/leave-optimizer/leave-optimizer";
import { detectCountry } from "./services/geolocation";
import { getUpcomingHolidays } from "./services/holidays";
import { getAvailableCountries } from "./utils/countries";

function getInitialLocation(): HolidayLocation | null {
  const hash = window.location.hash.slice(1).toUpperCase();
  if (!hash) return null;

  // Format: "AU" or "AU-QLD"
  const parts = hash.split("-");
  if (parts.length === 1 && parts[0]!.length === 2) {
    return { countryCode: parts[0]!, countryName: "" };
  }
  if (parts.length >= 2 && parts[0]!.length === 2) {
    return {
      countryCode: parts[0]!,
      countryName: "",
      regionCode: hash, // Full code like "AU-QLD"
    };
  }
  return null;
}

export default function App() {
  const [location, setLocation] = useState<HolidayLocation | null>(
    getInitialLocation
  );
  const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [activeTab, setActiveTab] = useState<"next" | "optimize">("next");

  // Resolve country name from hash on mount
  useEffect(() => {
    if (location && !location.countryName) {
      getAvailableCountries().then((countries) => {
        const c = countries.find(
          (c) => c.countryCode === location.countryCode
        );
        if (c) {
          setLocation((prev) =>
            prev ? { ...prev, countryName: c.name } : prev
          );
        }
      });
    }
  }, []);

  // Auto-detect country on mount if none selected
  useEffect(() => {
    if (location) return;
    setDetecting(true);
    detectCountry()
      .then((result) => {
        if (result) {
          setDetectedCountryCode(result.countryCode);
          getUpcomingHolidays(result.countryCode).catch(() => {});
        }
      })
      .finally(() => setDetecting(false));
  }, [location]);

  // Prefetch holidays when location is selected
  useEffect(() => {
    if (location?.countryCode) {
      getUpcomingHolidays(location.countryCode, location.regionCode).catch(
        () => {}
      );
    }
  }, [location]);

  function handleSelectLocation(
    countryCode: string,
    countryName: string,
    regionCode?: string
  ) {
    setLocation({ countryCode, countryName, regionCode });
    window.location.hash = regionCode ?? countryCode;
  }

  function handleBack() {
    setLocation(null);
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
        {location && (
          <button
            onClick={handleBack}
            className="cursor-pointer text-xs font-medium text-brand-grey transition-colors hover:text-brand-yellow"
          >
            Change location
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
            {!location || !location.countryName ? (
              <LocationSelect
                onSelect={handleSelectLocation}
                detectedCountryCode={detectedCountryCode}
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
                  <HolidayDisplay
                    countryCode={location.countryCode}
                    countryName={location.countryName}
                    regionCode={location.regionCode}
                    onBack={handleBack}
                  />
                ) : (
                  <LeaveOptimizer
                    countryCode={location.countryCode}
                    countryName={location.countryName}
                    regionCode={location.regionCode}
                    onBack={handleBack}
                  />
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
