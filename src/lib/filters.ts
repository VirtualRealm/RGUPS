import type { NewsItem, ScheduleEntry } from "./data";
export function filterNews(items: NewsItem[], query: string, category: string) {
  const q = query.trim().toLocaleLowerCase("ru-RU");
  return items
    .filter(
      (n) =>
        (category === "Все" || n.category === category) &&
        (!q ||
          (n.title + " " + n.excerpt).toLocaleLowerCase("ru-RU").includes(q)),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}
export function moscowToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function weekDates(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const d = new Date(date + "T12:00:00Z");
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== date)
    return [];
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setUTCDate(day.getUTCDate() + i);
    return day.toISOString().slice(0, 10);
  });
}
export function filterSchedule(
  items: ScheduleEntry[],
  mode: "group" | "teacher" | "room",
  value: string,
  date: string,
  week = false,
) {
  const dates = week ? weekDates(date) : [date];
  return items
    .filter((e) => e[mode] === value && dates.includes(e.date))
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.startsAt.localeCompare(b.startsAt),
    );
}
export function formatDay(date: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Moscow",
  }).format(new Date(date + "T12:00:00Z"));
}
