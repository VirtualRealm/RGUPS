"use client";
import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import data from "@/content/programs.json";
export function EducationCatalog() {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("Все");
  const [status, setStatus] = useState("Все");
  const [form, setForm] = useState("Все");
  const items = data.programs.filter(
    (p) =>
      (level === "Все" || p.level === level) &&
      (form === "Все" || p.forms.includes(form)) &&
      (status === "Все" ||
        (status === "Приём 2026" ? p.admission2026 : !p.admission2026)) &&
      `${p.code} ${p.title} ${p.profiles.join(" ")}`
        .toLocaleLowerCase("ru-RU")
        .includes(q.trim().toLocaleLowerCase("ru-RU")),
  );
  return (
    <>
      <div className="directory-tools">
        <div className="search-field">
          <Search size={19} />
          <input
            aria-label="Поиск специальности"
            placeholder="Код, направление или профиль"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <label className="field-label">
          Образование
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option>Все</option>
            <option>ВО</option>
            <option>СПО</option>
          </select>
        </label>
        <label className="field-label">
          Форма обучения
          <select value={form} onChange={(e) => setForm(e.target.value)}>
            <option>Все</option>
            <option>Очная</option>
            <option>Заочная</option>
          </select>
        </label>
        <label className="field-label">
          Программы
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Все</option>
            <option>Приём 2026</option>
            <option>Прежние наборы</option>
          </select>
        </label>
      </div>
      <p className="result-count" aria-live="polite">
        Найдено: {items.length} из {data.programs.length} · ВО — специалитет
      </p>
      <div className="program-list">
        {items.map((p) => (
          <article key={p.id} className="program-card">
            <div className="program-meta">
              <span>{p.code}</span>
              <span>
                {p.level === "ВО"
                  ? "Высшее образование"
                  : "Среднее профессиональное"}
              </span>
            </div>
            <h2>{p.title}</h2>
            {p.profiles.length > 0 && (
              <div className="chip-row">
                {p.profiles.map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
              </div>
            )}
            <p>{p.description}</p>
            <dl className="fact-list">
              <div>
                <dt>Форма</dt>
                <dd>{p.forms.join(" / ")}</dd>
              </div>
              <div>
                <dt>Основание</dt>
                <dd>{p.basis}</dd>
              </div>
              <div>
                <dt>Срок обучения</dt>
                <dd>{p.duration}</dd>
              </div>
            </dl>
            <span className="badge">
              {p.admission2026 ? "Приём 2026" : "Прежние наборы"}
            </span>
            <div>
              <Link
                className="button button-outline"
                href={`/education/programs/${p.id}`}
              >
                Программа и условия приёма
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!items.length && (
        <div className="empty-state">
          <h2>Направления не найдены</h2>
          <p>Измените запрос или фильтры.</p>
          <button
            className="button button-outline"
            onClick={() => {
              setQ("");
              setLevel("Все");
              setStatus("Все");
              setForm("Все");
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      )}
      <details className="content-block">
        <summary>Архив других образовательных программ</summary>
        <p>
          Коды, сохранившиеся в официальных сведениях прежних лет. В план приёма
          2026 года не включены.
        </p>
        <ul>
          {data.archivedPrograms.map((p) => (
            <li key={p.code}>
              {p.code} — {p.title}
            </li>
          ))}
        </ul>
        <a
          href="https://bypass.rgups.ru/filiali/voronezh/"
          target="_blank"
          rel="noreferrer"
        >
          Официальный реестр образовательных программ
        </a>
      </details>
    </>
  );
}
