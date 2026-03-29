import { useState, useEffect } from "react";
import type { Country, Region } from "../../types/holiday";
import {
  getAvailableCountries,
  getRegionsForCountry,
} from "../../utils/countries";

interface LocationSelectProps {
  onSelect: (countryCode: string, countryName: string, regionCode?: string) => void;
  detectedCountryCode: string | null;
  detecting: boolean;
}

export function LocationSelect({
  onSelect,
  detectedCountryCode,
  detecting,
}: LocationSelectProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [detectedCountryName, setDetectedCountryName] = useState<string | null>(null);

  // Fetch country list on mount
  useEffect(() => {
    getAvailableCountries()
      .then(setCountries)
      .catch(() => {});
  }, []);

  // Resolve detected country name
  useEffect(() => {
    if (detectedCountryCode && countries.length > 0) {
      const c = countries.find((c) => c.countryCode === detectedCountryCode);
      if (c) setDetectedCountryName(c.name);
    }
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
        <p className="mb-8 text-lg text-brand-white/70">
          Select your region for local holidays
        </p>

        <div className="mx-auto max-w-sm">
          <button
            onClick={() => onSelect(selectedCountry.countryCode, selectedCountry.name)}
            className="mb-4 w-full cursor-pointer rounded-lg border border-brand-yellow/20 bg-brand-yellow/5 px-4 py-3 text-sm font-medium text-brand-yellow transition-all hover:border-brand-yellow/40 hover:bg-brand-yellow/10"
          >
            Show all national holidays
          </button>

          <label className="mb-2 block text-left text-xs font-medium text-brand-grey uppercase tracking-wider">
            Or pick a region
          </label>
          <div className="relative">
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleRegionSelect(e.target.value);
              }}
              className="h-12 w-full cursor-pointer appearance-none rounded-lg bg-brand-white
                         pr-10 pl-4 text-sm text-brand-black shadow-lg outline-none
                         transition-shadow focus:ring-2 focus:ring-brand-yellow focus:shadow-brand-yellow/20"
            >
              <option value="" disabled>Choose region…</option>
              {regions.map((r) => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>
            <SelectArrow />
          </div>

          <button
            onClick={() => setSelectedCountry(null)}
            className="mt-4 cursor-pointer text-xs font-medium text-brand-grey transition-colors hover:text-brand-yellow"
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
      <p className="mb-8 text-lg text-brand-white/70">
        Find it instantly. Optimise your leave.
      </p>

      {/* Auto-detected country suggestion */}
      {detecting && (
        <div className="mx-auto mb-6 max-w-sm animate-pulse text-sm text-brand-grey">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-grey border-t-brand-yellow" />{" "}
          Detecting your location…
        </div>
      )}

      {detectedCountryName && !detecting && (
        <button
          onClick={() => handleCountrySelect(detectedCountryCode!)}
          className="mx-auto mb-6 flex cursor-pointer items-center gap-3 rounded-xl border border-brand-yellow/20 bg-brand-yellow/5 px-6 py-4 transition-all hover:border-brand-yellow/40 hover:bg-brand-yellow/10"
        >
          <svg className="h-5 w-5 text-brand-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="text-left">
            <div className="text-xs text-brand-grey">It looks like you're in</div>
            <div className="font-bold text-brand-yellow">{detectedCountryName}</div>
          </div>
          <svg className="ml-2 h-4 w-4 text-brand-grey" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Country selector */}
      <div className="mx-auto max-w-sm">
        <label className="mb-2 block text-left text-xs font-medium text-brand-grey uppercase tracking-wider">
          {detectedCountryName ? "Or select a different country" : "Select your country"}
        </label>
        <div className="relative">
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) handleCountrySelect(e.target.value);
            }}
            className="h-12 w-full cursor-pointer appearance-none rounded-lg bg-brand-white
                       pr-10 pl-4 text-sm text-brand-black shadow-lg outline-none
                       transition-shadow focus:ring-2 focus:ring-brand-yellow focus:shadow-brand-yellow/20"
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
          <div className="mt-4 animate-pulse text-sm text-brand-grey">
            Loading regions…
          </div>
        )}
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

function SelectArrow() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg bg-brand-yellow">
      <svg className="h-4 w-4 text-brand-black" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}
