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

export type AustralianStateCode =
  | "ACT"
  | "NSW"
  | "NT"
  | "QLD"
  | "SA"
  | "TAS"
  | "VIC"
  | "WA";

export interface AustralianState {
  code: AustralianStateCode;
  name: string;
  nagerCode: string;
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
