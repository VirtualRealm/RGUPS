"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  BookOpen,
  GraduationCap,
  ClipboardList,
  UsersRound,
  ShieldCheck,
  UserRound,
  Bell,
  LogOut,
  Monitor,
  ArrowRight,
} from "lucide-react";
import {
  portalRequest,
  PortalError,
  type Account,
  type SessionInfo,
} from "@/lib/account";
import type { OfficialLesson } from "@/lib/timetable";
import { formatDay, moscowToday } from "@/lib/filters";
import { DemoAccount } from "./account-demo";
type Dashboard = {
  account: Account;
  selectedGroup: { id: string; code: string } | null;
  date: string;
  sourceDate: string;
  schedule: OfficialLesson[];
  nextLesson: OfficialLesson | null;
  subjects: string[];
  groups: string[];
  reviewCount: number;
  courses: {
    id: string;
    title: string;
    description: string;
    semester: number;
    academicYear: number;
    status: string;
    groups: { group: { id: string; code: string } }[];
    _count: { materials: number; assignments: number };
  }[];
  grades: {
    id: string;
    subject: string;
    semester: number;
    controlType: string;
    grade: string;
    teacher: string;
    date: string;
  }[];
  assignments: {
    id: string;
    title: string;
    dueAt: string | null;
    maxScore: string;
    course: { title: string };
    submissions: {
      id: string;
      status: string;
      score: string | null;
      feedback: string | null;
    }[];
  }[];
  notifications: {
    id: string;
    title: string;
    body: string;
    href: string | null;
    readAt: string | null;
    createdAt: string;
  }[];
};
export type AccountSection =
  | "home"
  | "schedule"
  | "courses"
  | "grades"
  | "assignments"
  | "groups"
  | "notifications"
  | "profile"
  | "security";
const nav = [
  { key: "home", label: "Обзор", icon: UserRound, path: "/dashboard" },
  {
    key: "schedule",
    label: "Расписание",
    icon: CalendarDays,
    path: "/dashboard/schedule",
  },
  {
    key: "courses",
    label: "Дисциплины",
    icon: BookOpen,
    path: "/dashboard/courses",
  },
  {
    key: "grades",
    label: "Зачётная книжка",
    icon: GraduationCap,
    path: "/dashboard/grades",
  },
  {
    key: "assignments",
    label: "Задания",
    icon: ClipboardList,
    path: "/dashboard/assignments",
  },
  {
    key: "groups",
    label: "Мои группы",
    icon: UsersRound,
    path: "/dashboard/groups",
  },
  {
    key: "notifications",
    label: "Уведомления",
    icon: Bell,
    path: "/dashboard/notifications",
  },
  {
    key: "profile",
    label: "Профиль",
    icon: UserRound,
    path: "/dashboard/profile",
  },
  {
    key: "security",
    label: "Устройства и пароль",
    icon: ShieldCheck,
    path: "/dashboard/security",
  },
];
function Empty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="account-empty">
      <BookOpen size={30} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
function LessonList({ rows }: { rows: OfficialLesson[] }) {
  return rows.length ? (
    <div>
      {[...new Set(rows.map((l) => l.date))].map((day) => (
        <section className="account-day" key={day}>
          <h3>{formatDay(day)}</h3>
          {rows
            .filter((l) => l.date === day)
            .map((l) => (
              <article className="account-lesson" key={l.id}>
                <div className="account-time">
                  {l.startsAt}
                  <small>{l.endsAt}</small>
                </div>
                <div>
                  <span className="lesson-type">
                    {l.type} · {l.groups.join(" / ")}
                    {l.subgroup && ` · ${l.subgroup}`}
                  </span>
                  <h4>{l.subject}</h4>
                  <p>{l.teacher || "Преподаватель не указан"}</p>
                </div>
                <span className="account-room">Ауд. {l.room || "—"}</span>
              </article>
            ))}
        </section>
      ))}
    </div>
  ) : (
    <Empty title="Занятий в снимке не найдено">
      Выберите другую дату или проверьте обновления в официальном расписании.
      Отсутствие записи не означает свободный день.
    </Empty>
  );
}
export function AccountDashboard({
  section = "home",
  initialTeacher = false,
}: {
  section?: AccountSection;
  initialTeacher?: boolean;
}) {
  if (process.env.NEXT_PUBLIC_PORTAL_DEMO === "1")
    return <DemoAccount section={section} initialTeacher={initialTeacher} />;
  return <LiveAccountDashboard section={section} />;
}
function LiveAccountDashboard({
  section = "home",
}: {
  section?: AccountSection;
}) {
  const [date, setDate] = useState(moscowToday),
    [data, setData] = useState<Dashboard | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [reload, setReload] = useState(0),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    portalRequest<Dashboard>(
      `dashboard?date=${date}`,
      undefined,
      controller.signal,
    )
      .then((result) => {
        setData(result);
        setError("");
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        if (e instanceof PortalError && e.status === 401)
          window.location.replace("/login/");
        else setError(e.message);
      });
    return () => controller.abort();
  }, [date, reload]);
  async function mutate(action: string, input: unknown) {
    setBusy(true);
    setMessage("");
    try {
      const result = await portalRequest<{ message?: string }>(action, input);
      setMessage(result.message || "Сохранено");
      setReload((r) => r + 1);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка запроса");
    } finally {
      setBusy(false);
    }
  }
  if (error)
    return (
      <section className="container page-content">
        <div className="person-card">
          <h1>Личный кабинет</h1>
          <p role="alert">{error}</p>
          <button
            className="button button-outline"
            onClick={() => setReload((r) => r + 1)}
          >
            Повторить
          </button>
          <Link className="text-link" href="/login">
            Перейти ко входу
          </Link>
        </div>
      </section>
    );
  if (!data)
    return (
      <section className="container page-content" aria-busy="true">
        <p role="status">Открываем ваш личный кабинет…</p>
        <div className="account-skeleton" />
        <div className="account-skeleton" />
      </section>
    );
  const a = data.account,
    teacher =
      a.roles.includes("TEACHER") || a.affiliation?.requestedRole === "TEACHER",
    verified = a.status === "ACTIVE" && a.emailVerified;
  const today = data.schedule.filter((l) => l.date === date),
    currentTitle = nav.find((n) => n.key === section)?.label || "Обзор";
  return (
    <section className="container account-layout">
      <aside className="account-sidebar">
        <span className="eyebrow">ЛИЧНЫЙ КАБИНЕТ</span>
        <div className="account-identity">
          <span className="person-avatar">
            {a.firstName[0]}
            {a.lastName[0]}
          </span>
          <strong>
            {a.firstName} {a.lastName}
          </strong>
          <small>
            {teacher ? "Преподаватель" : data.selectedGroup?.code || "Студент"}
          </small>
          <span className={`badge ${verified ? "account-verified" : ""}`}>
            {verified
              ? "Подтверждён"
              : a.affiliation?.status === "REJECTED"
                ? "Заявка отклонена"
                : "Ожидает проверки"}
          </span>
        </div>
        <nav aria-label="Личный кабинет">
          {nav
            .filter((n) => (teacher ? n.key !== "grades" : n.key !== "groups"))
            .map((n) => (
              <Link
                key={n.key}
                href={n.path}
                className={section === n.key ? "active" : ""}
                aria-current={section === n.key ? "page" : undefined}
              >
                <n.icon size={18} />
                {teacher && n.key === "assignments"
                  ? "Работы на проверку"
                  : n.label}
              </Link>
            ))}
          {a.roles.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r)) && (
            <Link href="/admin/accounts">
              <ShieldCheck size={18} />
              Подтверждение аккаунтов
            </Link>
          )}
        </nav>
        <button
          className="account-logout"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await portalRequest("logout", {});
              window.location.replace("/login/");
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Не удалось выйти");
              setBusy(false);
            }
          }}
        >
          <LogOut size={18} />
          Выйти
        </button>
      </aside>
      <div className="account-main">
        <header className="account-heading">
          <div>
            <span className="eyebrow">
              {teacher ? "ПРОСТРАНСТВО ПРЕПОДАВАТЕЛЯ" : "ПРОСТРАНСТВО СТУДЕНТА"}
            </span>
            <h1>
              {section === "home"
                ? `Добрый день, ${a.firstName}`
                : currentTitle}
            </h1>
            <p>
              {section === "home"
                ? "Всё важное для учебного дня — рядом."
                : a.displayName}
            </p>
          </div>
          <span className="account-date">
            <CalendarDays size={20} />
            {formatDay(moscowToday())}
          </span>
        </header>
        {!verified && (
          <div className="account-notice">
            <ShieldCheck size={24} />
            <div>
              <strong>
                {a.affiliation?.status === "REJECTED"
                  ? "Заявка отклонена"
                  : "Аккаунт создан. Осталось подтвердить принадлежность"}
              </strong>
              <p>
                {a.affiliation?.reviewNote ||
                  "Администратор сверит анкету с университетским реестром. До проверки доступны собственный профиль, устройства и общедоступное расписание."}
              </p>
              {!a.emailVerified && (
                <button
                  className="text-link"
                  disabled={busy}
                  onClick={() => mutate("resend-verification", {})}
                >
                  Отправить письмо для подтверждения e-mail
                </button>
              )}
            </div>
          </div>
        )}
        {message && (
          <div className="form-feedback" role="status">
            {message}
          </div>
        )}
        {section === "home" && (
          <>
            <div className="account-stats">
              <Link href="/dashboard/schedule">
                <CalendarDays />
                <strong>{today.length}</strong>
                <span>занятий сегодня</span>
              </Link>
              <Link href="/dashboard/courses">
                <BookOpen />
                <strong>{data.courses.length}</strong>
                <span>курсов подключено</span>
              </Link>
              <Link
                href={teacher ? "/dashboard/groups" : "/dashboard/assignments"}
              >
                <UsersRound />
                <strong>
                  {teacher ? data.groups.length : data.assignments.length}
                </strong>
                <span>
                  {teacher ? "групп в расписании" : "заданий опубликовано"}
                </span>
              </Link>
              <Link href="/dashboard/notifications">
                <Bell />
                <strong>
                  {data.notifications.filter((n) => !n.readAt).length}
                </strong>
                <span>новых уведомлений</span>
              </Link>
            </div>
            <div className="account-overview">
              <section className="account-panel">
                <div className="account-panel-heading">
                  <h2>Сегодня</h2>
                  <Link className="text-link" href="/dashboard/schedule">
                    Вся неделя <ArrowRight size={14} />
                  </Link>
                </div>
                <LessonList rows={today} />
              </section>
              <section className="account-panel account-next">
                <span className="eyebrow">БЛИЖАЙШЕЕ ЗАНЯТИЕ</span>
                {data.nextLesson ? (
                  <>
                    <h2>{data.nextLesson.subject}</h2>
                    <p>
                      {formatDay(data.nextLesson.date)} ·{" "}
                      {data.nextLesson.startsAt}
                    </p>
                    <strong>
                      Аудитория {data.nextLesson.room || "не указана"}
                    </strong>
                    <p>{data.nextLesson.teacher}</p>
                  </>
                ) : (
                  <p>
                    Ближайшие занятия пока не опубликованы или профиль ещё не
                    связан с расписанием.
                  </p>
                )}
                <Link
                  className="button button-outline"
                  href="/dashboard/schedule"
                >
                  Открыть расписание
                </Link>
              </section>
            </div>
            <p className="result-count">
              Опубликованный снимок расписания от {data.sourceDate}.{" "}
              {verified ? "" : "Группа из анкеты ещё не подтверждена. "}
              Изменения после этой даты сверяйте с филиалом.
            </p>
            <div className="account-overview">
              <section className="account-panel">
                <h2>
                  {teacher ? "Мои дисциплины" : "Электронная зачётная книжка"}
                </h2>
                {(teacher ? data.courses.length : data.grades.length) > 0 ? (
                  <Link
                    className="text-link"
                    href={teacher ? "/dashboard/courses" : "/dashboard/grades"}
                  >
                    Открыть раздел →
                  </Link>
                ) : (
                  <Empty
                    title={
                      verified
                        ? "Данные ещё не опубликованы"
                        : "Доступ после подтверждения"
                    }
                  >
                    {teacher
                      ? "Здесь появятся закреплённые за вами курсы и материалы."
                      : "Оценки будут доступны после их внесения преподавателем или учебной частью."}
                  </Empty>
                )}
              </section>
              <section className="account-panel">
                <h2>{teacher ? "Работы на проверку" : "Новые задания"}</h2>
                <Empty
                  title={
                    teacher
                      ? `К проверке: ${data.reviewCount}`
                      : `Опубликовано: ${data.assignments.length}`
                  }
                >
                  Задания, сроки и результаты появятся после подключения учебных
                  курсов.
                </Empty>
                <Link className="text-link" href="/dashboard/assignments">
                  Перейти в раздел →
                </Link>
              </section>
            </div>
          </>
        )}
        {section === "schedule" && (
          <section className="account-panel">
            <div className="toolbar">
              <label className="field-label">
                Выберите дату недели
                <input
                  type="date"
                  min="2026-09-01"
                  max="2027-08-31"
                  value={date}
                  onChange={(e) => {
                    if (e.target.value) setDate(e.target.value);
                  }}
                />
              </label>
              <button
                className="button button-outline"
                onClick={() => setDate(moscowToday())}
              >
                Сегодня
              </button>
              <Link className="text-link" href="/schedule">
                Общее расписание →
              </Link>
            </div>
            <p className="result-count">
              {teacher
                ? a.teacher?.scheduleName ||
                  "Связь с расписанием устанавливает администратор"
                : data.selectedGroup?.code}{" "}
              · снимок от {data.sourceDate}
            </p>
            <LessonList rows={data.date === date ? data.schedule : []} />
          </section>
        )}
        {section === "courses" && (
          <>
            <section className="account-panel">
              <h2>Учебные курсы</h2>
              {data.courses.length ? (
                data.courses.map((c) => (
                  <article key={c.id} className="account-course">
                    <span className="badge">{c.semester} семестр</span>
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>
                    <p>
                      {c._count.materials} материалов · {c._count.assignments}{" "}
                      заданий
                    </p>
                    <p>{c.groups.map((g) => g.group.code).join(" · ")}</p>
                  </article>
                ))
              ) : (
                <Empty title="Курсы ещё не подключены">
                  Здесь будут лекции, практические, лабораторные, программное
                  обеспечение, задания и тесты. Доступ откроется после
                  назначения курсов вашей группе или преподавателю.
                </Empty>
              )}
            </section>
            <section className="account-panel">
              <h2>Дисциплины из расписания</h2>
              <p>
                Названия из публичного расписания. Наличие дисциплины здесь не
                означает, что электронный курс уже создан.
              </p>
              <div className="chip-row">
                {data.subjects.map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          </>
        )}
        {section === "grades" && (
          <section className="account-panel">
            {data.grades.length ? (
              <div className="table-scroll">
                <table className="content-table">
                  <thead>
                    <tr>
                      <th>Дисциплина</th>
                      <th>Семестр</th>
                      <th>Контроль</th>
                      <th>Оценка</th>
                      <th>Преподаватель</th>
                      <th>Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.grades.map((g) => (
                      <tr key={g.id}>
                        <td>{g.subject}</td>
                        <td>{g.semester}</td>
                        <td>
                          {{
                            EXAM: "Экзамен",
                            CREDIT: "Зачёт",
                            DIFFERENTIATED_CREDIT: "Дифф. зачёт",
                            COURSE_WORK: "Курсовая работа",
                          }[g.controlType] || g.controlType}
                        </td>
                        <td>
                          <strong>{g.grade}</strong>
                        </td>
                        <td>{g.teacher}</td>
                        <td>{g.date.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="В зачётной книжке пока нет записей">
                Здесь отображаются только ваши результаты из университетской
                базы. Демонстрационные оценки не подставляются.
              </Empty>
            )}
          </section>
        )}
        {section === "assignments" && (
          <section className="account-panel">
            {data.assignments.length ? (
              data.assignments.map((a) => (
                <article className="account-course" key={a.id}>
                  <span className="eyebrow">{a.course.title}</span>
                  <h3>{a.title}</h3>
                  <p>
                    Срок:{" "}
                    {a.dueAt
                      ? new Date(a.dueAt).toLocaleString("ru-RU", {
                          timeZone: "Europe/Moscow",
                        })
                      : "не установлен"}
                  </p>
                  <p>
                    Попыток: {a.submissions.length} · Максимум: {a.maxScore}
                  </p>
                </article>
              ))
            ) : (
              <Empty
                title={
                  teacher
                    ? `Работ на проверку: ${data.reviewCount}`
                    : "Новых заданий нет"
                }
              >
                Раздел заполняется учебными курсами. Приём файлов, создание
                тестов и выставление оценок будут подключены вместе с LMS.
              </Empty>
            )}
          </section>
        )}
        {section === "groups" && (
          <section className="account-panel">
            <h2>Группы из вашего расписания</h2>
            {data.groups.length ? (
              <div className="directory-grid">
                {data.groups.map((g) => (
                  <article className="person-card" key={g}>
                    <UsersRound />
                    <h3>{g}</h3>
                    <p>Публичное расписание ВО</p>
                    <Link className="text-link" href="/dashboard/schedule">
                      Мои занятия →
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <Empty title="Группы пока не связаны">
                После проверки анкеты администратор свяжет ваш профиль с записью
                преподавателя в расписании. Списки студентов доступны только в
                назначенных курсах.
              </Empty>
            )}
          </section>
        )}
        {section === "notifications" && (
          <section className="account-panel">
            {data.notifications.length ? (
              data.notifications.map((n) => (
                <article className="account-course" key={n.id}>
                  <span className="badge">
                    {n.readAt ? "Прочитано" : "Новое"}
                  </span>
                  <h3>{n.title}</h3>
                  <p>{n.body}</p>
                  <small>
                    {new Date(n.createdAt).toLocaleString("ru-RU", {
                      timeZone: "Europe/Moscow",
                    })}
                  </small>
                  {!n.readAt && (
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() => mutate("notification-read", { id: n.id })}
                    >
                      Отметить прочитанным
                    </button>
                  )}
                </article>
              ))
            ) : (
              <Empty title="Вы всё прочитали">
                Новые сообщения учебной части и уведомления по вашим курсам
                появятся здесь.
              </Empty>
            )}
          </section>
        )}
        {section === "profile" && (
          <Profile
            account={a}
            onSave={(input) => mutate("profile", input)}
            busy={busy}
          />
        )}
        {section === "security" && (
          <Security reload={reload} onAction={mutate} busy={busy} />
        )}
      </div>
    </section>
  );
}
function Profile({
  account: a,
  onSave,
  busy,
}: {
  account: Account;
  onSave: (input: unknown) => Promise<void>;
  busy: boolean;
}) {
  const [details, setDetails] = useState<{
    birthDate: string;
    studentNumber: string;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    portalRequest<{ birthDate: string; studentNumber: string }>(
      "profile",
      undefined,
      controller.signal,
    )
      .then(setDetails)
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return (
    <section className="account-panel">
      <h2>Личные данные</h2>
      <form
        className="auth-form account-profile"
        onSubmit={(e) => {
          e.preventDefault();
          const values = new FormData(e.currentTarget);
          void onSave(Object.fromEntries(values));
        }}
      >
        <fieldset
          className="auth-fields"
          disabled={busy || a.status !== "PENDING"}
        >
          <label>
            Фамилия
            <input
              name="lastName"
              defaultValue={a.lastName}
              required
              maxLength={80}
            />
          </label>
          <label>
            Имя
            <input
              name="firstName"
              defaultValue={a.firstName}
              required
              maxLength={80}
            />
          </label>
          <label>
            Отчество
            <input
              name="middleName"
              defaultValue={a.middleName || ""}
              maxLength={80}
            />
          </label>
          <button type="submit" className="button button-red">
            Сохранить
          </button>
        </fieldset>
      </form>
      <dl className="fact-list">
        <div>
          <dt>E-mail</dt>
          <dd>
            {a.email} · {a.emailVerified ? "подтверждён" : "не подтверждён"}
          </dd>
        </div>
        <div>
          <dt>Дата рождения</dt>
          <dd>{details?.birthDate || "—"}</dd>
        </div>
        <div>
          <dt>Студенческий билет</dt>
          <dd>{details?.studentNumber || "—"}</dd>
        </div>
        <div>
          <dt>Группа</dt>
          <dd>{a.group?.code || "Ожидает подтверждения"}</dd>
        </div>
      </dl>
      <p className="required-note">
        Изменение подтверждённых ФИО, группы, номера билета и e-mail
        производится через учебную часть после проверки.
      </p>
    </section>
  );
}
function Security({
  reload,
  onAction,
  busy,
}: {
  reload: number;
  onAction: (action: string, input: unknown) => Promise<void>;
  busy: boolean;
}) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    portalRequest<{ sessions: SessionInfo[] }>(
      "sessions",
      undefined,
      controller.signal,
    )
      .then((r) => {
        setSessions(r.sessions);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [reload]);
  return (
    <>
      <section className="account-panel">
        <h2>Устройства и активные входы</h2>
        <p>
          Сохранённый вход действует до 30 дней. Без запоминания cookie
          сессионная, а серверный срок — не более 12 часов. Некоторые браузеры
          восстанавливают сессию после перезапуска: на общем компьютере
          используйте «Выйти».
        </p>
        {error && <p role="alert">{error}</p>}
        {sessions.map((s) => (
          <article className="account-session" key={s.id}>
            <Monitor />
            <div>
              <h3>
                {s.deviceLabel}{" "}
                {s.current && <span className="badge">Это устройство</span>}
              </h3>
              <p>
                Вход:{" "}
                {new Date(s.createdAt).toLocaleString("ru-RU", {
                  timeZone: "Europe/Moscow",
                })}
              </p>
              <small>
                Последняя активность:{" "}
                {new Date(s.lastSeenAt).toLocaleString("ru-RU", {
                  timeZone: "Europe/Moscow",
                })}{" "}
                · {s.remembered ? "Запомнено на 30 дней" : "Сессионный вход"}
              </small>
            </div>
            <button
              className="button button-outline"
              disabled={busy}
              onClick={async () => {
                if (
                  window.confirm(
                    s.current
                      ? "Выйти из кабинета на этом устройстве?"
                      : "Завершить этот вход?",
                  )
                ) {
                  await onAction("revoke-session", { id: s.id });
                }
              }}
            >
              Завершить
            </button>
          </article>
        ))}
        {sessions.length > 1 && (
          <button
            className="button button-outline"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm("Завершить вход на всех остальных устройствах?")
              )
                void onAction("revoke-session", { others: true });
            }}
          >
            Выйти на остальных устройствах
          </button>
        )}
      </section>
      <section className="account-panel">
        <h2>Изменить пароль</h2>
        <form
          className="auth-form account-profile"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget,
              v = new FormData(form);
            if (v.get("password") !== v.get("confirmPassword")) {
              setError("Новые пароли не совпадают");
              return;
            }
            await onAction("change-password", {
              currentPassword: v.get("currentPassword"),
              password: v.get("password"),
            });
            form.reset();
          }}
        >
          <fieldset className="auth-fields" disabled={busy}>
            <label>
              Текущий пароль
              <input
                name="currentPassword"
                type="password"
                required
                maxLength={128}
                autoComplete="current-password"
              />
            </label>
            <label>
              Новый пароль
              <input
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
            <label>
              Повторите новый пароль
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
            <button className="button button-red" type="submit">
              Изменить пароль
            </button>
          </fieldset>
        </form>
      </section>
    </>
  );
}
