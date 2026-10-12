import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterNews,
  filterSchedule,
  weekDates,
  moscowToday,
} from "../src/lib/filters";
import { news, schedule } from "../src/lib/data";
test("news search handles Russian case, whitespace and category together", () => {
  const item = news[0];
  const result = filterNews(
    news,
    "  " + item.title.split(" ")[0].toUpperCase() + "  ",
    item.category,
  );
  assert.ok(result.some((n) => n.slug === item.slug));
  assert.equal(filterNews(news, "несуществующийматериал", "Все").length, 0);
});
test("schedule filters group, teacher and room without leaking unrelated lessons", () => {
  assert.equal(
    filterSchedule(schedule, "group", "ВДЖУ-241", "2026-10-09").length,
    3,
  );
  assert.equal(
    filterSchedule(schedule, "group", "ВДДМ-241", "2026-10-09").length,
    1,
  );
  assert.equal(
    filterSchedule(schedule, "teacher", "Воронов О. В.", "2026-10-09").length,
    1,
  );
  assert.ok(
    filterSchedule(schedule, "room", "310", "2026-10-09").every(
      (x) => x.room === "310",
    ),
  );
});
test("week starts Monday and handles a year boundary", () => {
  assert.deepEqual(weekDates("2027-01-01"), [
    "2026-12-28",
    "2026-12-29",
    "2026-12-30",
    "2026-12-31",
    "2027-01-01",
    "2027-01-02",
    "2027-01-03",
  ]);
  assert.deepEqual(weekDates(""), []);
  assert.equal(
    filterSchedule(schedule, "group", "ВДЖУ-241", "2026-10-09", true).length,
    4,
  );
});
test("today uses Moscow date at UTC day boundary", () =>
  assert.equal(moscowToday(new Date("2026-10-08T22:30:00Z")), "2026-10-09"));

test("invalid calendar dates are not normalized into another month", () =>
  assert.deepEqual(weekDates("2026-02-30"), []));
