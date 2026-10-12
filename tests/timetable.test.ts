import { test } from "node:test";
import { readFileSync } from "node:fs";
import catalog from "../src/content/schedule.json";
import assert from "node:assert/strict";
import data from "../src/content/schedule-lessons.json";
import { filterTimetable, timetableOptions } from "../src/lib/timetable";
test("all 96 session selections reconcile with the daily calendar", () => {
  assert.equal(catalog.sessions.length, 96);
  assert.equal(catalog.sessions.filter((s) => s.entryCount > 0).length, 78);
  assert.equal(
    catalog.sessions.reduce((sum, s) => sum + s.entryCount, 0),
    1908,
  );
  for (const session of catalog.sessions) {
    const entries = data.lessons.filter(
      (l) =>
        l.form === "Заочная" &&
        session.from &&
        session.to &&
        l.date >= session.from &&
        l.date <= session.to &&
        l.groups.some((g) => session.groups.includes(g)),
    );
    assert.equal(entries.length, session.entryCount, session.id);
  }
});
test("SPO replacements have locally bundled original PDF evidence", () => {
  assert.equal(catalog.changes.length, 38);
  assert.equal(catalog.spoOptions.length, 12);
  assert.ok(catalog.spoOptions.every((o) => !o.publishedContent));
  for (const d of catalog.documents) {
    const bytes = readFileSync(
      new URL(`../public${d.localUrl}`, import.meta.url),
    );
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
  }
  for (const c of catalog.changes) {
    assert.ok(
      catalog.documents.some((d) => d.url === c.sourceUrl && d.date === c.date),
    );
    assert.ok(c.lessonNumber > 0 && c.sourcePage > 0);
  }
});
test("published daily rows reconcile across the entire requested academic year", () => {
  assert.equal(data.failures.length, 0);
  assert.equal(data.successfulDates.length, 365);
  assert.equal(
    data.successfulDates.reduce((sum, day) => sum + day.count, 0),
    data.lessons.length,
  );
  assert.equal(data.lessons.length, 4400);
  assert.equal(
    new Set(data.lessons.map((x) => x.id)).size,
    data.lessons.length,
  );
  const counts = new Map<string, number>();
  for (const row of data.lessons) {
    counts.set(row.date, (counts.get(row.date) ?? 0) + 1);
    assert.ok(row.groups.length);
    assert.ok(row.startsAt < row.endsAt);
    assert.equal(
      row.date,
      [
        row.sourceRequest.Year,
        row.sourceRequest.Month,
        row.sourceRequest.Day,
      ].join("-"),
    );
  }
  for (const day of data.successfulDates)
    assert.equal(counts.get(day.date) ?? 0, day.count);
});
test("combined streams are findable by each participating group", () => {
  const row = data.lessons.find((x) => x.groups.length > 1)!;
  for (const group of row.groups)
    assert.ok(
      filterTimetable(data.lessons, "group", group, row.date).some(
        (x) => x.id === row.id,
      ),
    );
  assert.ok(timetableOptions(data.lessons, "group").includes(row.groups[1]));
});
test("date, teacher, room and study form filters do not mix unrelated lessons", () => {
  const row = data.lessons.find((x) => x.date === "2026-10-12")!;
  assert.ok(
    filterTimetable(data.lessons, "teacher", row.teacher, row.date).every(
      (x) => x.teacher === row.teacher && x.date === row.date,
    ),
  );
  assert.ok(
    filterTimetable(
      data.lessons,
      "room",
      row.room,
      row.date,
      false,
      "Очная",
    ).every((x) => x.room === row.room && x.form === "Очная"),
  );
  assert.equal(
    filterTimetable(data.lessons, "group", "НЕСУЩЕСТВУЕТ", row.date).length,
    0,
  );
  assert.equal(
    filterTimetable(data.lessons, "group", "", "2026-02-30").length,
    0,
  );
  assert.ok(
    filterTimetable(
      data.lessons,
      "group",
      "ВДЖУ-241",
      "2026-10-14",
      true,
    ).every((x) => x.date >= "2026-10-12" && x.date <= "2026-10-18"),
  );
});
