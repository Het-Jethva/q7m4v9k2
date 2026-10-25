export type Unit = "GW" | "MW";
export const dateText = (
  date: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
) =>
  new Date(date.includes("T") ? date : `${date}T00:00:00Z`).toLocaleDateString(
    "en-GB",
    { ...options, timeZone: "Europe/London" },
  );
export const hourText = (date: string) =>
  new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
export const unitValue = (value: number | null, unit: Unit) =>
  value === null ? null : value / (unit === "GW" ? 1000 : 1);
