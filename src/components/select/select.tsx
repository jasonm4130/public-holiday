import { useState, useEffect, useMemo } from "react";
import type { Country, Region } from "../../types/holiday";
import { getAvailableCountries, getRegionsForCountry } from "../../utils/countries";

interface LocationSelectProps {
  onSelect: (countryCode: string, countryName: string, regionCode?: string) => void;
  detectedCountryCode: string | null;
  detecting: boolean;
}

export function LocationSelect({ onSelect, detectedCountryCode, detecting }: LocationSelectProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);

  // Fetch country list on mount
  useEffect(() => {
    getAvailableCountries()
      .then(setCountries)
      .catch(() => {});
  }, []);

  // Derive detected country name from list
  const detectedCountryName = useMemo(() => {
    if (!detectedCountryCode || countries.length === 0) return null;
    return countries.find((c) => c.countryCode === detectedCountryCode)?.name ?? null;
  }, [detectedCountryCode, countries]);

  // Load regions when country selected
  useEffect(() => {
    if (!selectedCountry) {
      setRegions([]);
      return;
    }
    setLoadingRegions(true);
    getRegionsForCountry(selectedCountry.countryCode)
      .then((r) => {
        setRegions(r);
        // If no regions, auto-select country-level
        if (r.length === 0) {
          onSelect(selectedCountry.countryCode, selectedCountry.name);
        }
      })
      .catch(() => setRegions([]))
      .finally(() => setLoadingRegions(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

  function handleCountrySelect(code: string) {
    const country = countries.find((c) => c.countryCode === code);
    if (country) setSelectedCountry(country);
  }

  function handleRegionSelect(regionCode: string) {
    if (!selectedCountry) return;
    if (regionCode === "__all__") {
      onSelect(selectedCountry.countryCode, selectedCountry.name);
    } else {
      onSelect(selectedCountry.countryCode, selectedCountry.name, regionCode);
    }
  }

  // If a country is selected and has regions, show region picker
  if (selectedCountry && regions.length > 0 && !loadingRegions) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6 flex justify-center">
          <img src="/logo.svg" alt="Public Holiday" className="h-20 w-20 drop-shadow-lg" />
        </div>
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {selectedCountry.name}
        </h1>
        <p className="text-fg/70 mb-8 text-lg">Select your region for local holidays</p>

        <div className="mx-auto max-w-sm">
          <button
            onClick={() => onSelect(selectedCountry.countryCode, selectedCountry.name)}
            className="border-accent/20 bg-accent/5 text-accent-fg hover:border-accent/40 hover:bg-accent/10 mb-4 w-full cursor-pointer rounded-lg border px-4 py-3 text-sm font-medium transition-all"
          >
            Show all national holidays
          </button>

          <label
            htmlFor="region-select"
            className="text-muted mb-2 block text-left text-xs font-medium tracking-wider uppercase"
          >
            Or pick a region
          </label>
          <div className="relative">
            <select
              id="region-select"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleRegionSelect(e.target.value);
              }}
              className="bg-surface text-fg focus:ring-accent focus:shadow-accent/20 h-12 w-full cursor-pointer appearance-none rounded-lg pr-10 pl-4 text-sm shadow-lg transition-shadow outline-none focus:ring-2"
            >
              <option value="" disabled>
                Choose region…
              </option>
              {regions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
            <SelectArrow />
          </div>

          <button
            onClick={() => setSelectedCountry(null)}
            className="text-muted hover:text-accent-fg mt-4 cursor-pointer text-xs font-medium transition-colors"
          >
            ← Change country
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="mb-6 flex justify-center">
        <img src="/logo.svg" alt="Public Holiday" className="h-20 w-20 drop-shadow-lg" />
      </div>

      <h1 className="mb-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
        Your next public holiday
      </h1>
      <p className="text-fg/70 mb-8 text-lg">Find it instantly. Optimise your leave.</p>

      {/* Auto-detected country suggestion */}
      {detecting && (
        <div className="text-muted mx-auto mb-6 max-w-sm animate-pulse text-sm">
          <span className="border-muted border-t-accent inline-block h-4 w-4 animate-spin rounded-full border-2" />{" "}
          Detecting your location…
        </div>
      )}

      {detectedCountryName && !detecting && (
        <button
          onClick={() => handleCountrySelect(detectedCountryCode!)}
          className="border-accent/20 bg-accent/5 hover:border-accent/40 hover:bg-accent/10 mx-auto mb-6 flex cursor-pointer items-center gap-3 rounded-xl border px-6 py-4 transition-all"
        >
          <svg
            className="text-accent-fg h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <div className="text-left">
            <div className="text-muted text-xs">It looks like you're in</div>
            <div className="text-accent-fg font-bold">{detectedCountryName}</div>
          </div>
          <svg
            className="text-muted ml-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Country selector */}
      <div className="mx-auto max-w-sm">
        <label
          htmlFor="country-select"
          className="text-muted mb-2 block text-left text-xs font-medium tracking-wider uppercase"
        >
          {detectedCountryName ? "Or select a different country" : "Select your country"}
        </label>
        <div className="relative">
          <select
            id="country-select"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) handleCountrySelect(e.target.value);
            }}
            className="bg-surface text-fg focus:ring-accent focus:shadow-accent/20 h-12 w-full cursor-pointer appearance-none rounded-lg pr-10 pl-4 text-sm shadow-lg transition-shadow outline-none focus:ring-2"
          >
            <option value="" disabled>
              {countries.length === 0 ? "Loading countries…" : "Choose country…"}
            </option>
            {countries.map((c) => (
              <option key={c.countryCode} value={c.countryCode}>
                {c.name}
              </option>
            ))}
          </select>
          <SelectArrow />
        </div>

        {loadingRegions && (
          <div className="text-muted mt-4 animate-pulse text-sm">Loading regions…</div>
        )}
      </div>

      <div className="text-muted mx-auto mt-10 max-w-md text-center text-sm leading-relaxed">
        <p>
          See your next public holiday instantly, or use the{" "}
          <strong className="text-accent-fg">Leave Optimizer</strong> to find the best days to take
          off for maximum time away.
        </p>
      </div>
    </div>
  );
}

function SelectArrow() {
  return (
    <div className="bg-accent pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg">
      <svg className="text-ocean-deep h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}
