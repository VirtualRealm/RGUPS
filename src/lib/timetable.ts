import type data from "@/content/schedule-lessons.json";
import { weekDates } from "./filters";
export type OfficialLesson = (typeof data.lessons)[number];
export type TimetableMode = "group" | "teacher" | "room";
export function filterTimetable(
  items: OfficialLesson[],
  mode: TimetableMode,
  value: string,
  date: string,
  week = false,
  form = "Все",
) {
  if (!weekDates(date).length) return [];
  const dates = new Set(week ? weekDates(date) : [date]);
  return items
    .filter(
      (e) =>
        dates.has(e.date) &&
        (form === "Все" || e.form === form) &&
        (!value ||
          (mode === "group" ? e.groups.includes(value) : e[mode] === value)),
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.startsAt.localeCompare(b.startsAt) ||
        a.group.localeCompare(b.group, "ru"),
    );
}
export function timetableOptions(
  items: OfficialLesson[],
  mode: TimetableMode,
  form = "Все",
) {
  return [
    ...new Set(
      items
        .filter((e) => form === "Все" || e.form === form)
        .flatMap((e) => (mode === "group" ? e.groups : [e[mode]]))
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, "ru", { numeric: true }));
}
