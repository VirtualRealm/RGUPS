"use client";
import { useState } from "react";
import data from "@/content/schedule.json";
import lessonData from "@/content/schedule-lessons.json";
import { formatDay } from "@/lib/filters";

const flows = [
  ...new Map(data.sessions.map((s) => [s.sourceRequest.NP, s])).values(),
];
const changeDates = [...new Set(data.changes.map((c) => c.date))]
  .sort()
  .reverse();
export function ScheduleDetails() {
  const [flow, setFlow] = useState(flows[0].sourceRequest.NP);
  const [sessionNumber, setSessionNumber] = useState("1");
  const [changeDate, setChangeDate] = useState(changeDates[0]);
  const [group, setGroup] = useState("");
  const [spo, setSpo] = useState(data.spoOptions[0].id);
  const session = data.sessions.find(
    (s) => s.sourceRequest.NP === flow && String(s.number) === sessionNumber,
  )!;
  const sessionLessons = lessonData.lessons.filter(
    (l) =>
      l.form === "Заочная" &&
      session.from &&
      session.to &&
      l.date >= session.from &&
      l.date <= session.to &&
      l.groups.some((g) => session.groups.includes(g)),
  );
  const changes = data.changes.filter(
    (c) =>
      (!changeDate || c.date === changeDate) && (!group || c.group === group),
  );
  const selectedSpo = data.spoOptions.find((s) => s.id === spo)!;
  return (
    <>
      <section id="sessions" className="content-block">
        <span className="eyebrow">ВО · ЗАОЧНАЯ ФОРМА</span>
        <h2>Заочные сессии</h2>
        <p>
          32 учебных потока. Проверены три сессии каждого потока; расписание
          опубликовано для 78 сессий.
        </p>
        <div className="toolbar">
          <label className="field-label">
            Учебный поток
            <select value={flow} onChange={(e) => setFlow(e.target.value)}>
              {flows.map((s) => (
                <option key={s.sourceRequest.NP} value={s.sourceRequest.NP}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Сессия
            <select
              value={sessionNumber}
              onChange={(e) => setSessionNumber(e.target.value)}
            >
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  Сессия {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="result-count" aria-live="polite">
          {session.from && session.to
            ? `${formatDay(session.from)} — ${formatDay(session.to)} · Занятий: ${sessionLessons.length}`
            : "В опубликованном снимке расписания этой сессии пока нет."}
        </p>
        {sessionLessons.length > 0 && (
          <div className="table-scroll">
            <table className="content-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Время</th>
                  <th>Дисциплина</th>
                  <th>Вид занятия</th>
                  <th>Преподаватель</th>
                  <th>Аудитория</th>
                </tr>
              </thead>
              <tbody>
                {sessionLessons.map((l) => (
                  <tr key={l.id}>
                    <td>{formatDay(l.date)}</td>
                    <td>
                      {l.startsAt}–{l.endsAt}
                    </td>
                    <td>
                      {l.subject}
                      {l.subgroup && <small> · {l.subgroup}</small>}
                    </td>
                    <td>{l.type}</td>
                    <td>{l.teacher || "Не указан"}</td>
                    <td>{l.room || "Не указана"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <form
          action={session.sourceUrl}
          method="post"
          target="_blank"
          rel="noreferrer"
        >
          {Object.entries(session.sourceRequest).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <button className="text-link" type="submit">
            Проверить сессию в официальном сервисе ↗
          </button>
        </form>
      </section>
      <section id="spo-changes" className="content-block">
        <span className="eyebrow">СРЕДНЕЕ ПРОФЕССИОНАЛЬНОЕ ОБРАЗОВАНИЕ</span>
        <h2>Замены занятий СПО</h2>
        <p>
          38 изменений из опубликованных PDF на 9, 10 и 12 октября. Номер пары и
          обозначения сохранены из документов; время занятий не предполагалось.
        </p>
        <div className="toolbar">
          <label className="field-label">
            Дата замен
            <select
              value={changeDate}
              onChange={(e) => {
                setChangeDate(e.target.value);
                setGroup("");
              }}
            >
              <option value="">Все опубликованные даты</option>
              {changeDates.map((d) => (
                <option key={d} value={d}>
                  {formatDay(d)}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Группа СПО
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="">Все группы</option>
              {[
                ...new Set(
                  data.changes
                    .filter((c) => !changeDate || c.date === changeDate)
                    .map((c) => c.group),
                ),
              ]
                .sort()
                .map((g) => (
                  <option key={g}>{g}</option>
                ))}
            </select>
          </label>
        </div>
        <p className="result-count" aria-live="polite">
          Найдено замен: {changes.length}
        </p>
        <div className="table-scroll">
          <table className="content-table">
            <thead>
              <tr>
                <th>Дата / группа</th>
                <th>Пара</th>
                <th>По расписанию</th>
                <th>Замена</th>
                <th>Аудитория</th>
                <th>Документ</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c) => (
                <tr key={c.id}>
                  <td>
                    {formatDay(c.date)}
                    <br />
                    <strong>{c.group}</strong>
                    <br />
                    <small>{c.weekLabel}</small>
                  </td>
                  <td>{c.lessonNumber}</td>
                  <td>{c.original}</td>
                  <td>{c.replacement}</td>
                  <td>{c.room || "—"}</td>
                  <td>
                    <a
                      href={
                        data.documents.find((d) => d.url === c.sourceUrl)
                          ?.localUrl || c.sourceUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      PDF, стр. {c.sourcePage}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details className="content-block">
          <summary>Основное расписание СПО: состояние источника</summary>
          <p>
            Все 12 вариантов официальной формы на момент проверки возвращают
            пустую страницу. Поэтому здесь показаны подтверждённые замены, а
            основное расписание следует уточнять в учебной части. Отсутствие
            записи не означает свободный день.
          </p>
          <form
            action={selectedSpo.sourceUrl}
            method="post"
            target="_blank"
            rel="noreferrer"
            className="toolbar"
          >
            <label className="field-label">
              Группы в официальном сервисе
              <select value={spo} onChange={(e) => setSpo(e.target.value)}>
                {data.spoOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
            {Object.entries(selectedSpo.sourceRequest).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <button className="button button-outline" type="submit">
              Проверить источник ↗
            </button>
          </form>
        </details>
      </section>
    </>
  );
}
