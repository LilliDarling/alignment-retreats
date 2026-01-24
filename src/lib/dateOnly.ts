import { isValid, parseISO } from "date-fns";

/**
 * Parses a date-only string (e.g. "2026-03-20") in a timezone-safe way.
 *
 * Why: `new Date("YYYY-MM-DD")` is interpreted as midnight UTC in JS, which can
 * display as the previous day for users in timezones behind UTC.
 */
export function parseDateOnly(input?: string | null): Date | null {
  if (!input) return null;
  const d = parseISO(input);
  return isValid(d) ? d : null;
}
