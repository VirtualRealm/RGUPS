import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesQuery, paginate } from "../src/lib/directory";
import programs from "../src/content/programs.json";
import teachers from "../src/content/teachers.json";
import timetable from "../src/content/schedule.json";
test("directory search tolerates Russian spelling, punctuation and reordered words", () => {
  assert.ok(
    matchesQuery("Пётр Иванов — Теория электрических цепей", "иванов петр"),
  );
  assert.ok(
    matchesQuery("23.05.06 Строительство железных дорог", "23 05 06 железных"),
  );
  assert.equal(matchesQuery("Иванов — Математика", "Иванов физика"), false);
});
test("filtered pagination does not strand the user on an empty page", () => {
  assert.deepEqual(paginate([1, 2, 3], 12, 2), {
    items: [3],
    pages: 2,
    current: 2,
  });
  assert.deepEqual(paginate([], 12), { items: [], pages: 1, current: 1 });
});
test("admissions totals reconcile with published program rows and quotas", () => {
  const sums = { ВО: { budget: 0, paid: 0 }, СПО: { budget: 0, paid: 0 } };
  for (const p of programs.programs) {
    assert.ok(p.sources.every((s) => new URL(s).protocol === "https:"));
    if (!p.admission2026) {
      assert.equal(p.places.length, 0);
      continue;
    }
    for (const r of p.places) {
      sums[p.level as "ВО" | "СПО"].budget += r.budget;
      sums[p.level as "ВО" | "СПО"].paid += r.paid;
      if ("general" in r)
        assert.equal(
          r.general! + r.target! + r.special! + r.separate!,
          r.budget,
        );
    }
  }
  assert.deepEqual(sums, {
    ВО: {
      budget: programs.totals2026.voBudget,
      paid: programs.totals2026.voPaid,
    },
    СПО: {
      budget: programs.totals2026.spoBudget,
      paid: programs.totals2026.spoPaid,
    },
  });
  assert.equal(
    new Set(programs.programs.map((p) => p.id)).size,
    programs.programs.length,
  );
});
test("all published teacher rows remain represented after deduplication", () => {
  assert.equal(teachers.teachers.length, 102);
  assert.equal(new Set(teachers.teachers.map((t) => t.id)).size, 102);
  assert.equal(
    new Set(teachers.teachers.map((t) => t.name.toLocaleLowerCase("ru-RU")))
      .size,
    102,
  );
  const assignments = teachers.teachers.flatMap((t) => t.assignments);
  assert.equal(assignments.length, teachers.sourceRowCount);
  for (const source of teachers.sources) {
    const rows = assignments
      .filter((a) => a.sourceId === source.id)
      .map((a) => a.sourceRow)
      .sort((a, b) => a - b);
    assert.deepEqual(
      rows,
      Array.from({ length: source.rowCount }, (_, i) => i + 1),
      source.title,
    );
  }
  for (const t of teachers.teachers) {
    assert.ok(t.name.trim().split(/\s+/).length >= 2);
    assert.ok(t.sourceUrls.every((u) => new URL(u).hostname === "vfrgups.ru"));
    assert.ok(t.disciplines.length > 0);
  }
});
test("official schedule catalog preserves coverage without mock dated lessons", () => {
  assert.equal(timetable.lessons.length, 0);
  assert.equal(timetable.coverage.status, "complete_vo_partial_spo");
  assert.deepEqual(
    timetable.documents
      .filter((d) => d.type === "Занятия")
      .map((d) => d.course),
    [1, 2, 3, 4, 5],
  );
  assert.equal(
    new Set(timetable.documents.map((d) => d.url)).size,
    timetable.documents.length,
  );
  for (const d of timetable.documents) {
    assert.equal(new URL(d.url).hostname, "vfrgups.ru");
    if (d.type === "Изменения") {
      assert.ok(d.date);
      assert.equal(d.archived, d.date! < timetable.verifiedAt);
    }
  }
});
test("full-time higher education contains exactly the two confirmed specialties", () => {
  assert.deepEqual(
    programs.programs
      .filter(
        (p) => p.level === "ВО" && p.admission2026 && p.forms.includes("Очная"),
      )
      .map((p) => p.code)
      .sort(),
    ["23.05.04", "23.05.06"],
  );
  assert.equal(
    programs.programs.filter(
      (p) => p.level === "ВО" && p.admission2026 && p.forms.includes("Заочная"),
    ).length,
    4,
  );
});
