"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { programs, additionalPrograms } from "@/lib/data";
export function ProgramBrowser({
  additional = false,
}: {
  additional?: boolean;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("Все");
  const items = additional
    ? additionalPrograms.map((p) => ({
        ...p,
        level: p.category,
        code: "ДПО",
        duration: "По учебному плану",
      }))
    : programs;
  const result = items.filter(
    (p) =>
      (filter === "Все" || p.level === filter) &&
      p.title
        .toLocaleLowerCase("ru-RU")
        .includes(q.trim().toLocaleLowerCase("ru-RU")),
  );
  return (
    <>
      <div className="toolbar">
        <div className="search-field">
          <Search size={19} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Найти программу"
            placeholder="Название программы или направления"
          />
        </div>
        <label className="field-label">
          <span className="sr-only">Уровень образования</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Категория образования"
          >
            <option>Все</option>
            {[...new Set(items.map((p) => p.level))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="result-count" aria-live="polite">
        Найдено направлений: {result.length}
      </div>
      {result.length ? (
        <div className="program-list">
          {result.map((p) => (
            <article key={p.id} className="program-card">
              <div className="program-meta">
                <span>{p.code}</span>
                <span>{p.level}</span>
              </div>
              <h2>{p.title}</h2>
              <p>{p.description}</p>
              <span className="badge">{p.duration}</span>
              <div>
                <Link
                  className="button button-outline"
                  href={
                    additional ? `/education/additional/${p.id}` : "/admissions"
                  }
                >
                  {additional ? "О программе" : "Узнать о поступлении"}
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Программы не найдены</h2>
          <p>Попробуйте другое название или категорию.</p>
          <button
            className="button button-outline"
            onClick={() => {
              setQ("");
              setFilter("Все");
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </>
  );
}
