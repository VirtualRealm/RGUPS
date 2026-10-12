"use client";
import { useState } from "react";
import { Search, CalendarDays, FileText, ExternalLink } from "lucide-react";
import data from "@/content/schedule.json";
import { matchesQuery } from "@/lib/directory";
export function ScheduleBrowser() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("Все");
  const [course, setCourse] = useState("Все");
  const [archive, setArchive] = useState(false);
  const docs = data.documents.filter(
    (d) =>
      (level === "Все" || d.level === level) &&
      (course === "Все" || String(d.course) === course) &&
      (archive || !d.archived) &&
      matchesQuery(
        d.title + " " + d.period + " " + d.type + " " + d.groups.join(" "),
        query,
      ),
  );
  const services = data.services.filter(
    (s) => level === "Все" || s.level === level,
  );
  return (
    <>
      <div className="directory-stats">
        <div>
          <strong>2026/27</strong>
          <span>учебный год</span>
        </div>
        <div>
          <strong>1–5</strong>
          <span>курсы ВО: опубликованные PDF</span>
        </div>
        <div>
          <strong>ВО + СПО</strong>
          <span>занятия, сессии, изменения</span>
        </div>
      </div>
      <div className="schedule-controls">
        <div className="tabs" aria-label="Уровень образования">
          {["Все", "ВО", "СПО"].map((l) => (
            <button
              aria-pressed={level === l}
              key={l}
              onClick={() => {
                setLevel(l);
                setCourse("Все");
              }}
            >
              {l === "Все"
                ? "Все расписания"
                : l === "ВО"
                  ? "Высшее образование"
                  : "Среднее профессиональное"}
            </button>
          ))}
        </div>
        <div className="toolbar">
          <div className="search-field">
            <Search size={19} />
            <input
              aria-label="Поиск документа расписания"
              placeholder="Курс, вид расписания или дата изменения"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <label className="field-label">
            Курс ВО
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              disabled={level === "СПО"}
            >
              <option>Все</option>
              {[1, 2, 3, 4, 5].map((c) => (
                <option key={c} value={c}>
                  {c} курс
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={archive}
              onChange={(e) => setArchive(e.target.checked)}
            />
            Архив и прошедшие изменения
          </label>
        </div>
      </div>
      <section className="content-block">
        <h2>Расписание по группам и преподавателям</h2>
        <div className="directory-grid">
          {services.map((s) => (
            <a
              className="schedule-service"
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="eyebrow">
                {s.level} · {s.form}
              </span>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
              <span className="text-link">
                Выбрать на сайте филиала <ExternalLink size={13} />
              </span>
            </a>
          ))}
        </div>
        <div className="schedule-status">
          <CalendarDays size={22} />
          <div>
            <strong>
              Снимок опубликованного расписания от 11 октября 2026
            </strong>
            <p>
              Все опубликованные занятия ВО за проверенный учебный год доступны
              в календаре выше. Основное расписание СПО источник пока не отдаёт.
              Проверяйте новые публикации и замены в официальных сервисах.
            </p>
          </div>
        </div>
      </section>
      <section className="content-block">
        <h2>Документы расписания</h2>
        <p className="result-count" aria-live="polite">
          Найдено документов: {docs.length} из {data.documents.length}
        </p>
        {docs.map((d) => (
          <article className="schedule-document" key={d.id}>
            <FileText size={27} aria-hidden="true" />
            <div>
              <div className="schedule-document-meta">
                {d.level} · {d.form} · {d.fileType}
                {d.archived ? " · Архив" : ""}
              </div>
              <h3>{d.title}</h3>
              <p>{d.period}</p>
              <div className="schedule-file-links">
                <a href={d.url} target="_blank" rel="noreferrer">
                  PDF на сайте филиала
                </a>
                <a href={d.sourceUrl} target="_blank" rel="noreferrer">
                  Страница публикации
                </a>
              </div>
            </div>
            <a
              className="button button-outline"
              href={d.localUrl}
              target="_blank"
              rel="noreferrer"
            >
              Открыть PDF <ExternalLink size={14} />
            </a>
          </article>
        ))}
        {!docs.length && (
          <div className="empty-state">
            <CalendarDays size={32} />
            <h3>Документы по этому фильтру не найдены</h3>
            <p>
              Проверьте расписание в официальном сервисе или измените фильтры.
            </p>
            <button
              className="button button-outline"
              onClick={() => {
                setQuery("");
                setLevel("Все");
                setCourse("Все");
                setArchive(true);
              }}
            >
              Показать все документы
            </button>
          </div>
        )}
      </section>
      <details className="content-block">
        <summary>Расписание звонков ВО</summary>
        <p>{data.bellSchedule.note}</p>
        <div className="table-scroll">
          <table className="content-table">
            <thead>
              <tr>
                <th>Пара</th>
                <th>Начало</th>
                <th>Окончание</th>
              </tr>
            </thead>
            <tbody>
              {data.bellSchedule.entries.map((e) => (
                <tr key={e.lessonNumber}>
                  <td>{e.lessonNumber}</td>
                  <td>{e.startsAt}</td>
                  <td>{e.endsAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <a
          className="document-link"
          href={data.bellSchedule.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          {data.bellSchedule.sourceTitle}
        </a>
      </details>
    </>
  );
}
