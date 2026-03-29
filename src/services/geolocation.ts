interface GeoResult {
  countryCode: string;
}

/**
 * Map IANA timezone → ISO 3166-1 alpha-2 country code.
 * Covers the most common timezones; returns null for unknowns.
 */
const TZ_COUNTRY: Record<string, string> = {
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Perth": "AU",
  "Australia/Adelaide": "AU",
  "Australia/Hobart": "AU",
  "Australia/Darwin": "AU",
  "Australia/ACT": "AU",
  "Australia/Canberra": "AU",
  "Australia/Lord_Howe": "AU",
  "Australia/Lindeman": "AU",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Anchorage": "US",
  "Pacific/Honolulu": "US",
  "America/Phoenix": "US",
  "America/Indiana/Indianapolis": "US",
  "America/Detroit": "US",
  "America/Boise": "US",
  "Europe/London": "GB",
  "Europe/Berlin": "DE",
  "Europe/Paris": "FR",
  "Europe/Rome": "IT",
  "Europe/Madrid": "ES",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Vienna": "AT",
  "Europe/Zurich": "CH",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI",
  "Europe/Dublin": "IE",
  "Europe/Lisbon": "PT",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Budapest": "HU",
  "Europe/Bucharest": "RO",
  "Europe/Sofia": "BG",
  "Europe/Athens": "GR",
  "Europe/Istanbul": "TR",
  "Europe/Moscow": "RU",
  "Europe/Kiev": "UA",
  "Europe/Belgrade": "RS",
  "Europe/Zagreb": "HR",
  "Europe/Ljubljana": "SI",
  "Europe/Bratislava": "SK",
  "Europe/Tallinn": "EE",
  "Europe/Riga": "LV",
  "Europe/Vilnius": "LT",
  "Europe/Luxembourg": "LU",
  "Europe/Malta": "MT",
  "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK",
  "Asia/Singapore": "SG",
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Dubai": "AE",
  "Asia/Jakarta": "ID",
  "Asia/Bangkok": "TH",
  "Asia/Manila": "PH",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Taipei": "TW",
  "Asia/Karachi": "PK",
  "Asia/Dhaka": "BD",
  "Pacific/Auckland": "NZ",
  "Pacific/Fiji": "FJ",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Halifax": "CA",
  "America/St_Johns": "CA",
  "America/Sao_Paulo": "BR",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Mexico_City": "MX",
  "America/Bogota": "CO",
  "America/Lima": "PE",
  "America/Santiago": "CL",
  "America/Caracas": "VE",
  "Africa/Johannesburg": "ZA",
  "Africa/Cairo": "EG",
  "Africa/Lagos": "NG",
  "Africa/Nairobi": "KE",
  "Africa/Casablanca": "MA",
};

function countryFromTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TZ_COUNTRY[tz] ?? null;
  } catch {
    return null;
  }
}

/**
 * Try to detect the user's country:
 * 1. Fast path: infer from browser timezone
 * 2. Fallback: use geolocation API + reverse lookup
 */
export function detectCountry(): Promise<GeoResult | null> {
  // Fast: timezone-based detection
  const tzCountry = countryFromTimezone();
  if (tzCountry) {
    return Promise.resolve({ countryCode: tzCountry });
  }

  // Slow: geolocation + BigDataCloud free reverse geocode
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          );
          if (!res.ok) {
            resolve(null);
            return;
          }
          const data = await res.json();
          const code = data?.countryCode;
          if (code && typeof code === "string") {
            resolve({ countryCode: code.toUpperCase() });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      { timeout: 5000, maximumAge: 600000 },
    );
  });
}
