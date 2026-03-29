export interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

export interface PublicHoliday {
  date: Date;
  name: string;
  localName: string;
  global: boolean;
  counties: string[];
}

export interface Country {
  countryCode: string;
  name: string;
}

/** A sub-region within a country (e.g. AU-QLD, US-CA, DE-BY) */
export interface Region {
  code: string;
  name: string;
}

/** Fully resolved location: country + optional region */
export interface HolidayLocation {
  countryCode: string;
  countryName: string;
  regionCode?: string;
  regionName?: string;
}

export interface LeaveBlock {
  startDate: Date;
  endDate: Date;
  leaveDaysUsed: number;
  totalDaysOff: number;
  efficiency: number;
  leaveDates: Date[];
  holidays: PublicHoliday[];
  description: string;
}
