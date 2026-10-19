import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);

export const MONTH_FORMAT = "YYYY-MM";

/**
 * Bridge between the stored `YYYY-MM` strings and Ant Design's DatePicker,
 * which works in Dayjs objects. Storing Dayjs in Redux or Firestore would
 * break serialisation, so conversion happens at the form boundary only.
 * A bare `YYYY` (common in imported resumes) is shown as January of that year.
 */
export function toMonth(value: string | undefined): Dayjs | null {
  if (!value) return null;
  const month = dayjs(value, MONTH_FORMAT, true);
  if (month.isValid()) return month;
  const year = dayjs(value, "YYYY", true);
  return year.isValid() ? year : null;
}

export function fromMonth(value: Dayjs | null | undefined): string {
  return value && dayjs.isDayjs(value) ? value.format(MONTH_FORMAT) : "";
}

/** "3 minutes ago", for the dashboard's last-edited column. */
export function timeAgo(iso: string): string {
  const date = dayjs(iso);
  return date.isValid() ? date.fromNow() : "";
}

export function formatDateTime(iso: string): string {
  const date = dayjs(iso);
  return date.isValid() ? date.format("D MMM YYYY, HH:mm") : "";
}
