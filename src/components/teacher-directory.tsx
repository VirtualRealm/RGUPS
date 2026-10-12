"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, UsersRound } from "lucide-react";
import type { TeacherSummary } from "@/lib/teachers";
import { matchesQuery, paginate } from "@/lib/directory";
export function TeacherDirectory({ teachers }: { teachers: TeacherSummary[] }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("Все");
  const [program, setProgram] = useState("Все");
  const [page, setPage] = useState(1);
  const codes = [
    ...new Set(
      teachers
        .filter((t) => level === "Все" || t.levels.includes(level))
        .flatMap((t) => t.programCodes),
    ),
  ].sort();
  const result = teachers.filter(
    (t) =>
      (level === "Все" || t.levels.includes(level)) &&
      (program === "Все" || t.programCodes.includes(program)) &&
      matchesQuery(
        [
          t.name,
          t.position,
          t.degree,
          t.title,
          ...t.disciplines,
          ...t.programCodes,
        ].join(" "),
        query,
      ),
  );
  const paged = paginate(result, page, 18);
  function reset() {
    setQuery("");
    setLevel("Все");
    setProgram("Все");
    setPage(1);
  }
  return (
    <>
      <div className="directory-tools">
        <div className="search-field">
          <Search size={19} />
          <input
            aria-label="Поиск преподавателя, дисциплины или специальности"
            placeholder="Фамилия, дисциплина или код специальности"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <label className="field-label">
          Образование
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              setProgram("Все");
              setPage(1);
            }}
          >
            <option>Все</option>
            <option>ВО</option>
            <option>СПО</option>
          </select>
        </label>
        <label className="field-label">
          Специальность
          <select
            value={program}
            onChange={(e) => {
              setProgram(e.target.value);
              setPage(1);
            }}
          >
            <option>Все</option>
            {codes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button className="button button-outline" onClick={reset}>
          Сбросить
        </button>
      </div>
      <p className="result-count" aria-live="polite">
        Найдено преподавателей: {result.length} из {teachers.length} · По
        алфавиту · Страница {paged.current} из {paged.pages}
      </p>
      <div className="directory-grid">
        {paged.items.map((t) => (
          <article className="person-card" key={t.id}>
            <div className="person-top">
              <span className="person-avatar" aria-hidden="true">
                {t.name
                  .split(" ")
                  .slice(0, 2)
                  .map((s) => s[0])
                  .join("")}
              </span>
              <div>
                <span className="person-role">{t.position}</span>
                <h2 className="teacher-name">
                  <Link href={`/university/teachers/${t.id}`}>{t.name}</Link>
                </h2>
              </div>
            </div>
            <div className="chip-row">
              {t.levels.map((l) => (
                <span className="badge" key={l}>
                  {l}
                </span>
              ))}
              {t.programCodes.map((c) => (
                <span className="chip" key={c}>
                  {c}
                </span>
              ))}
            </div>
            {t.degree !== "Не указана" && <p>{t.degree}</p>}
            <p className="teacher-disciplines">
              {t.disciplines.slice(0, 3).join(" · ")}
              {t.disciplines.length > 3
                ? ` · ещё ${t.disciplines.length - 3}`
                : ""}
            </p>
            <Link className="text-link" href={`/university/teachers/${t.id}`}>
              Профиль, дисциплины и квалификация →
            </Link>
          </article>
        ))}
      </div>
      {!result.length && (
        <div className="empty-state">
          <UsersRound size={34} />
          <h2>Преподаватели не найдены</h2>
          <p>
            Попробуйте часть фамилии, название дисциплины или другой фильтр.
          </p>
          <button className="button button-outline" onClick={reset}>
            Показать всех преподавателей
          </button>
        </div>
      )}
      {paged.pages > 1 && (
        <nav className="pagination" aria-label="Страницы преподавателей">
          <button
            aria-label="Предыдущая страница"
            disabled={paged.current === 1}
            onClick={() => setPage(paged.current - 1)}
          >
            ←
          </button>
          {Array.from({ length: paged.pages }, (_, i) => i + 1).map((n) => (
            <button
              aria-label={`Страница ${n}`}
              aria-current={n === paged.current ? "page" : undefined}
              key={n}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          <button
            aria-label="Следующая страница"
            disabled={paged.current === paged.pages}
            onClick={() => setPage(paged.current + 1)}
          >
            →
          </button>
        </nav>
      )}
    </>
  );
}
