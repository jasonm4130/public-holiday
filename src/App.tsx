import { useState, useEffect } from "react";
import type { HolidayLocation } from "./types/holiday";
import { LocationSelect } from "./components/select/select";
import { HolidayDisplay } from "./components/holiday-display/holiday-display";
import { LeaveOptimizer } from "./components/leave-optimizer/leave-optimizer";
import { detectCountry } from "./services/geolocation";
import { getUpcomingHolidays } from "./services/holidays";
import { getAvailableCountries } from "./utils/countries";

function getInitialTheme(): "light" | "dark" {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

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
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);
  const [location, setLocation] = useState<HolidayLocation | null>(getInitialLocation);
  const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [activeTab, setActiveTab] = useState<"next" | "optimize">("next");

  // Apply theme class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Resolve country name from hash on mount
  useEffect(() => {
    if (location && !location.countryName) {
      getAvailableCountries().then((countries) => {
        const c = countries.find((c) => c.countryCode === location.countryCode);
        if (c) {
          setLocation((prev) => (prev ? { ...prev, countryName: c.name } : prev));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      getUpcomingHolidays(location.countryCode, location.regionCode).catch(() => {});
    }
  }, [location]);

  function handleSelectLocation(countryCode: string, countryName: string, regionCode?: string) {
    setLocation({ countryCode, countryName, regionCode });
    window.location.hash = regionCode ?? countryCode;
  }

  function handleBack() {
    setLocation(null);
    setActiveTab("next");
    window.history.replaceState(null, "", " ");
  }

  return (
    <div className="bg-page text-fg flex min-h-screen w-full flex-col transition-colors duration-300">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <button
          onClick={handleBack}
          className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80"
        >
          <img src="/logo.svg" alt="" className="h-8 w-8" />
          <span className="text-sm font-bold tracking-wide">
            My Next <span className="text-accent-fg">Public Holiday</span>
          </span>
        </button>
        <div className="flex items-center gap-3">
          {location && (
            <button
              onClick={handleBack}
              className="text-muted hover:text-accent-fg cursor-pointer text-xs font-medium transition-colors"
            >
              Change location
            </button>
          )}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted hover:text-accent-fg flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-2xl text-center">
          <div className="transition-opacity duration-300" style={{ opacity: 1 }}>
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
                        ? "bg-accent text-ocean-deep"
                        : "bg-muted/20 text-accent-fg hover:bg-muted/30"
                    }`}
                  >
                    Next Holiday
                  </button>
                  <button
                    onClick={() => setActiveTab("optimize")}
                    className={`cursor-pointer rounded-t-lg px-6 py-3 text-sm font-bold transition-colors ${
                      activeTab === "optimize"
                        ? "bg-accent text-ocean-deep"
                        : "bg-muted/20 text-accent-fg hover:bg-muted/30"
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
      <footer className="text-muted px-4 py-4 text-center text-xs">
        Holiday data from{" "}
        <a
          href="https://date.nager.at/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted underline transition-colors"
        >
          Nager.Date API
        </a>
        {" · "}
        Open source on{" "}
        <a
          href="https://github.com/jasonm4130/public-holiday"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted underline transition-colors"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
