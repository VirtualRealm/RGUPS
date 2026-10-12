"use client";
import { useState, useSyncExternalStore } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import data from "@/content/schedule-lessons.json";
import {
  filterTimetable,
  timetableOptions,
  type TimetableMode,
} from "@/lib/timetable";
import { formatDay, moscowToday, weekDates } from "@/lib/filters";
const subscribe = () => () => {};
const labels = { group: "Группа", teacher: "Преподаватель", room: "Аудитория" };
const serverDay = () => data.verifiedAt;
export function Timetable() {
  const today = useSyncExternalStore(subscribe, moscowToday, serverDay);
  const [pickedDate, setDate] = useState("");
  const [mode, setMode] = useState<TimetableMode>("group");
  const [form, setForm] = useState("Все");
  const [value, setValue] = useState("ВДЖУ-241");
  const [week, setWeek] = useState(false);
  const date = pickedDate || today;
  const valid = weekDates(date).length > 0;
  const options = timetableOptions(data.lessons, mode, form);
  const lessons = filterTimetable(data.lessons, mode, value, date, week, form);
  const days = [...new Set(lessons.map((l) => l.date))];
  const next = data.lessons
    .filter(
      (e) =>
        e.date > date &&
        (form === "Все" || e.form === form) &&
        (!value ||
          (mode === "group" ? e.groups.includes(value) : e[mode] === value)),
    )
    .map((e) => e.date)
    .sort()[0];
  function shift(amount: number) {
    if (!valid) return;
    const d = new Date(date + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + amount);
    const next = d.toISOString().slice(0, 10);
    setDate(
      next < data.range.from
        ? data.range.from
        : next > data.range.to
          ? data.range.to
          : next,
    );
  }
  return (
    <section className="timetable-section" id="calendar">
      <div className="directory-heading">
        <span className="eyebrow">
          ВЫСШЕЕ ОБРАЗОВАНИЕ · ОЧНАЯ И ЗАОЧНАЯ ФОРМЫ
        </span>
        <h2>Твой учебный день</h2>
        <p>
          {data.lessons.length.toLocaleString("ru-RU")} занятий из официального
          электронного расписания. Снимок от 11 октября 2026 года.
        </p>
      </div>
      <div className="schedule-controls">
        <div className="tabs" aria-label="Режим поиска расписания">
          {(Object.keys(labels) as TimetableMode[]).map((m) => (
            <button
              key={m}
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                setValue("");
              }}
            >
              {labels[m]}
            </button>
          ))}
        </div>
        <div className="toolbar">
          <label className="field-label">
            Форма обучения
            <select
              value={form}
              onChange={(e) => {
                setForm(e.target.value);
                setValue("");
              }}
            >
              <option>Все</option>
              <option>Очная</option>
              <option>Заочная</option>
            </select>
          </label>
          <label className="field-label timetable-select">
            {labels[mode]}
            <select value={value} onChange={(e) => setValue(e.target.value)}>
              <option value="">Все</option>
              {options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Дата
            <input
              type="date"
              value={date}
              min={data.range.from}
              max={data.range.to}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <button
            className="button button-outline"
            onClick={() => {
              setDate(today);
              setWeek(false);
            }}
          >
            Сегодня
          </button>
        </div>
        <div className="timetable-period">
          <div className="tabs" aria-label="Период расписания">
            <button aria-pressed={!week} onClick={() => setWeek(false)}>
              День
            </button>
            <button aria-pressed={week} onClick={() => setWeek(true)}>
              Неделя
            </button>
          </div>
          <div className="date-arrows">
            <button
              className="button button-outline"
              disabled={!valid || date <= data.range.from}
              aria-label={week ? "Предыдущая неделя" : "Предыдущий день"}
              onClick={() => shift(week ? -7 : -1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              {valid
                ? week
                  ? formatDay(weekDates(date)[0]) +
                    " — " +
                    formatDay(weekDates(date)[6])
                  : formatDay(date)
                : "Выберите дату"}
            </span>
            <button
              className="button button-outline"
              disabled={!valid || date >= data.range.to}
              aria-label={week ? "Следующая неделя" : "Следующий день"}
              onClick={() => shift(week ? 7 : 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
      <div aria-live="polite">
        <p className="result-count">
          Занятий в опубликованном снимке: {lessons.length} · {value || "Все"}
          {week ? " · Неделя" : ""}
        </p>
        {days.map((day) => (
          <section key={day} className="schedule-day">
            <h3>{formatDay(day)}</h3>
            {lessons
              .filter((l) => l.date === day)
              .map((l) => (
                <article key={l.id} className="schedule-row">
                  <time>
                    {l.startsAt}
                    <small>{l.endsAt}</small>
                  </time>
                  <div>
                    <span className="lesson-type">
                      {l.type} · {l.groups.join(" / ")}
                      {l.subgroup ? " · " + l.subgroup : ""}
                    </span>
                    <h4>{l.subject}</h4>
                    <span className="lesson-form">
                      {l.form} форма · {l.course} курс
                    </span>
                  </div>
                  <p className="teacher">
                    {l.teacher || "Преподаватель не указан"}
                  </p>
                  <div className="room">
                    Аудитория<b>{l.room || "Не указана"}</b>
                  </div>
                </article>
              ))}
          </section>
        ))}
      </div>
      {!lessons.length && (
        <div className="empty-state">
          <CalendarDays size={34} />
          <h3>
            {valid
              ? "Занятия в опубликованном снимке не найдены"
              : "Выберите дату"}
          </h3>
          <p>
            {valid
              ? "На выбранный период для этого фильтра записей нет. Будущие занятия и замены могут появиться после обновления источника."
              : "Укажите календарную дату учебного года 2026/2027."}
          </p>
          {next && (
            <button
              className="button button-outline"
              onClick={() => {
                setDate(next);
                setWeek(false);
              }}
            >
              Ближайшие опубликованные занятия · {formatDay(next)}
            </button>
          )}
        </div>
      )}
      <div className="timetable-source">
        <p>
          Время и подгруппы сохранены из источника. Изменения после 11 октября
          проверяйте на сайте филиала.
        </p>
        {valid && (
          <form
            action="https://vfrgups.ru/portal/list_day.php"
            method="post"
            target="_blank"
            rel="noreferrer"
          >
            <input type="hidden" name="Day" value={date.slice(8, 10)} />
            <input type="hidden" name="Month" value={date.slice(5, 7)} />
            <input type="hidden" name="Year" value={date.slice(0, 4)} />
            <button className="text-link" type="submit">
              Этот день в официальном расписании ↗
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
