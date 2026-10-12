"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import management from "@/content/management.json";
export function StructureBrowser() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("Все");
  const q = query.trim().toLocaleLowerCase("ru-RU");
  const items = management.units.filter(
    (x) =>
      (kind === "Все" || x.kind === kind) &&
      `${x.name} ${x.head} ${x.address}`.toLocaleLowerCase("ru-RU").includes(q),
  );
  return (
    <>
      <div className="toolbar">
        <div className="search-field">
          <Search size={19} />
          <input
            aria-label="Найти подразделение или руководителя"
            placeholder="Подразделение, руководитель или адрес"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="field-label">
          Раздел
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option>Все</option>
            <option>Органы управления</option>
            <option>Подразделения</option>
          </select>
        </label>
      </div>
      <p className="result-count" aria-live="polite">
        Найдено: {items.length} из {management.units.length}
      </p>
      <div className="directory-grid">
        {items.map((x) => (
          <article className="person-card" key={x.id}>
            <span className="eyebrow">{x.kind}</span>
            <h2 className="unit-title">{x.name}</h2>
            <dl className="fact-list">
              <div>
                <dt>Руководитель</dt>
                <dd>
                  {x.head}
                  <small>{x.position}</small>
                </dd>
              </div>
              <div>
                <dt>Адрес</dt>
                <dd>{x.address}</dd>
              </div>
            </dl>
            {x.email && (
              <p className="unit-contact">
                Почта подразделения: <a href={`mailto:${x.email}`}>{x.email}</a>
              </p>
            )}
            {x.regulations.map((r) => (
              <a
                className="document-link"
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noreferrer"
              >
                {r.title} ↗
              </a>
            ))}
            <a
              className="text-link"
              href={x.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Контакты подразделения
            </a>
          </article>
        ))}
      </div>
      {!items.length && (
        <div className="empty-state">
          <h2>Подразделения не найдены</h2>
          <p>Измените запрос или сбросьте фильтры.</p>
          <button
            className="button button-outline"
            onClick={() => {
              setQuery("");
              setKind("Все");
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </>
  );
}
