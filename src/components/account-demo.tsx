"use client";
import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import snapshot from "@/content/schedule-lessons.json";
import { formatDay, weekDates } from "@/lib/filters";
import type { AccountSection } from "./account-dashboard";

export function DemoAccount({
  section = "home",
  initialTeacher = false,
}: {
  section?: AccountSection;
  initialTeacher?: boolean;
}) {
  const [teacher, setTeacher] = useState(initialTeacher),
    [date, setDate] = useState("2026-10-12"),
    [week, setWeek] = useState(false);
  const group = "ВДЖУ-241";
  const teacherName =
    snapshot.lessons.find((l) => l.groups.includes(group) && l.date === date)
      ?.teacher || "Воронов О.В.";
  const lessons = snapshot.lessons.filter(
    (l) =>
      (teacher ? l.teacher === teacherName : l.groups.includes(group)) &&
      (week ? weekDates(date).includes(l.date) : l.date === date),
  );
  const links: [AccountSection, string, string][] = [
    ["home", "Обзор", "/dashboard"],
    ["schedule", "Расписание", "/dashboard/schedule"],
    ["courses", "Дисциплины", "/dashboard/courses"],
    [
      teacher ? "groups" : "grades",
      teacher ? "Мои группы" : "Зачётная книжка",
      teacher ? "/dashboard/groups" : "/dashboard/grades",
    ],
    [
      "assignments",
      teacher ? "Работы на проверку" : "Задания",
      "/dashboard/assignments",
    ],
    ["notifications", "Уведомления", "/dashboard/notifications"],
    ["profile", "Профиль", "/dashboard/profile"],
    ["security", "Устройства и пароль", "/dashboard/security"],
  ];
  return (
    <section className="container account-layout">
      <aside className="account-sidebar">
        <span className="eyebrow">ЛИЧНЫЙ КАБИНЕТ · ДЕМО</span>
        <div className="account-identity">
          <span className="person-avatar">РВ</span>
          <strong>{teacher ? "Преподаватель" : "Студент"}</strong>
          <small>{teacher ? "Пример рабочего пространства" : group}</small>
          <span className="badge">Демонстрационные данные</span>
        </div>
        <nav aria-label="Демонстрационный кабинет">
          {links.map(([key, label, href]) => (
            <Link
              key={key}
              href={href}
              className={section === key ? "active" : ""}
              aria-current={section === key ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link className="text-link" href="/">
          На сайт
        </Link>
      </aside>
      <div className="account-main">
        <header className="account-heading">
          <div>
            <span className="eyebrow">ВАШЕ УЧЕБНОЕ ПРОСТРАНСТВО</span>
            <h1>
              {links.find(([key]) => key === section)?.[1] || "Личный кабинет"}
            </h1>
            <p>Всё важное для учёбы — в одном месте.</p>
          </div>
        </header>
        <div className="account-notice account-demo-notice">
          <strong>Предпросмотр кабинета</strong>
          <p>
            Здесь можно посмотреть интерфейс. Настоящая регистрация, сохранение
            входа и личные данные доступны в серверной версии портала. Этот
            просмотр не создаёт аккаунт.
          </p>
          <div className="tabs">
            <button
              type="button"
              aria-pressed={!teacher}
              className={!teacher ? "active" : ""}
              onClick={() => setTeacher(false)}
            >
              Я студент
            </button>
            <button
              type="button"
              aria-pressed={teacher}
              className={teacher ? "active" : ""}
              onClick={() => setTeacher(true)}
            >
              Я преподаватель
            </button>
          </div>
        </div>
        {section === "home" && (
          <>
            <div className="account-stats">
              {[
                [
                  CalendarDays,
                  String(lessons.length),
                  "Занятий в выбранный день",
                ],
                [BookOpen, "2", "Демо-дисциплины"],
                [
                  teacher ? UsersRound : GraduationCap,
                  teacher ? "2" : "7",
                  teacher ? "Демо-группы" : "Семестр · пример",
                ],
                [ShieldCheck, "30 дней", "Сохранение входа на сервере"],
              ].map(([Icon, value, label], i) => {
                const Symbol = Icon as typeof CalendarDays;
                return (
                  <article className="stat-card" key={i}>
                    <Symbol size={22} />
                    <strong>{String(value)}</strong>
                    <span>{String(label)}</span>
                  </article>
                );
              })}
            </div>
            <h2>Сегодня в вашем расписании</h2>
          </>
        )}
        {(section === "home" || section === "schedule") && (
          <section className="account-panel">
            <div className="account-panel-heading">
              <h2>{formatDay(date)}</h2>
              <label>
                Выбрать дату
                <input
                  type="date"
                  value={date}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                />
              </label>
            </div>
            <label>
              <input
                type="checkbox"
                checked={week}
                onChange={(e) => setWeek(e.target.checked)}
              />{" "}
              Показать неделю
            </label>
            <p className="field-help">
              Официальный снимок расписания ВО от 11.10.2026.{" "}
              {teacher ? teacherName : group}.
            </p>
            {lessons.length ? (
              lessons.map((l) => (
                <article className="account-lesson" key={l.id}>
                  <div className="account-time">
                    {l.startsAt}
                    <small>{l.endsAt}</small>
                  </div>
                  <div>
                    <span className="lesson-type">
                      {week ? `${formatDay(l.date)} · ` : ""}
                      {l.type} · {l.groups.join(" / ")}
                    </span>
                    <h4>{l.subject}</h4>
                    <p>{l.teacher}</p>
                  </div>
                  <span className="account-room">Ауд. {l.room || "—"}</span>
                </article>
              ))
            ) : (
              <p>
                В снимке нет занятий на выбранную дату. Проверьте другую дату
                или официальное расписание.
              </p>
            )}
          </section>
        )}
        {(section === "home" || section === "courses") && (
          <section className="account-panel">
            <h2>Мои дисциплины</h2>
            <p className="field-help">
              Примеры карточек. Учебные материалы появятся после наполнения
              курсов преподавателями.
            </p>
            <div className="account-course-grid">
              {["Мосты и транспортные тоннели", "Организация перевозок"].map(
                (name) => (
                  <article key={name} className="account-course">
                    <BookOpen />
                    <h3>{name}</h3>
                    <p>Демо-курс · 2026/2027 · 7 семестр</p>
                    <span className="badge">Предпросмотр</span>
                  </article>
                ),
              )}
            </div>
          </section>
        )}
        {section === "grades" && (
          <section className="account-panel">
            <h2>Электронная зачётная книжка</h2>
            <p>Образец оформления — это не реальные оценки студента.</p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Дисциплина</th>
                    <th>Семестр</th>
                    <th>Контроль</th>
                    <th>Результат</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Мосты и транспортные тоннели</td>
                    <td>7</td>
                    <td>Экзамен</td>
                    <td>5 · пример</td>
                  </tr>
                  <tr>
                    <td>Экономика</td>
                    <td>7</td>
                    <td>Зачёт</td>
                    <td>Зачтено · пример</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}
        {section === "groups" && (
          <section className="account-panel">
            <h2>Учебные группы</h2>
            <p>
              В серверном кабинете список формируется по расписанию
              подтверждённого преподавателя.
            </p>
            <div className="tabs">
              <span className="badge">ВДЖУ-241 · пример</span>
              <span className="badge">ВДДМ-241 · пример</span>
            </div>
          </section>
        )}
        {section === "assignments" && (
          <section className="account-panel">
            <h2>{teacher ? "Работы на проверку" : "Задания и сроки"}</h2>
            <p>
              Здесь отображаются задания ваших курсов и результаты проверки. В
              демонстрации учебные работы не принимаются.
            </p>
            <Link className="text-link" href="/dashboard/courses">
              Мои дисциплины →
            </Link>
          </section>
        )}
        {section === "notifications" && (
          <section className="account-panel">
            <h2>Уведомления</h2>
            <strong>Добро пожаловать в новый портал</strong>
            <p>
              В рабочем кабинете здесь появляются результаты проверки аккаунта и
              сообщения об учебных событиях.
            </p>
          </section>
        )}
        {section === "profile" && (
          <section className="account-panel">
            <h2>Личные данные</h2>
            <p>
              ФИО, e-mail, дата рождения, группа и номер студенческого билета
              доступны только владельцу аккаунта. Реальные персональные данные в
              HTML-демонстрации не сохраняются.
            </p>
            <Link className="button button-red" href="/registration">
              Посмотреть форму регистрации
            </Link>
          </section>
        )}
        {section === "security" && (
          <section className="account-panel">
            <h2>Устройства и пароль</h2>
            <p>
              В серверной версии можно сохранить вход на 30 дней, посмотреть
              активные устройства, завершить отдельную сессию или все остальные,
              изменить пароль.
            </p>
            <p>
              Пароль меняется с проверкой текущего пароля. После восстановления
              доступа все прежние сессии закрываются.
            </p>
            <Link className="text-link" href="/login">
              Форма входа →
            </Link>
          </section>
        )}
      </div>
    </section>
  );
}

export function DemoServerOnly() {
  return (
    <section className="container page-content">
      <div className="account-panel">
        <h1>Доступно в серверной версии</h1>
        <p>
          Подтверждение e-mail и управление аккаунтами требуют защищённого
          сервера. Этот файл предназначен для просмотра интерфейса.
        </p>
        <Link className="button button-red" href="/dashboard">
          Посмотреть личный кабинет
        </Link>
      </div>
    </section>
  );
}
