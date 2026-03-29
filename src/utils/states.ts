import type { AustralianState, AustralianStateCode } from "../types/holiday";

export const AUSTRALIAN_STATES: AustralianState[] = [
  { code: "ACT", name: "Australian Capital Territory", nagerCode: "AU-ACT" },
  { code: "NSW", name: "New South Wales", nagerCode: "AU-NSW" },
  { code: "NT", name: "Northern Territory", nagerCode: "AU-NT" },
  { code: "QLD", name: "Queensland", nagerCode: "AU-QLD" },
  { code: "SA", name: "South Australia", nagerCode: "AU-SA" },
  { code: "TAS", name: "Tasmania", nagerCode: "AU-TAS" },
  { code: "VIC", name: "Victoria", nagerCode: "AU-VIC" },
  { code: "WA", name: "Western Australia", nagerCode: "AU-WA" },
];

export function getStateByCode(code: AustralianStateCode): AustralianState {
  const state = AUSTRALIAN_STATES.find((s) => s.code === code);
  if (!state) throw new Error(`Unknown state code: ${code}`);
  return state;
}

export function getNagerCode(code: AustralianStateCode): string {
  return `AU-${code}`;
}
