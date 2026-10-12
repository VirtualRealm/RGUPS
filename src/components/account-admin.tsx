"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { portalRequest, PortalError } from "@/lib/account";
import { DemoServerOnly } from "./account-demo";
type RequestItem = {
  id: string;
  requestedRole: string;
  createdAt: string;
  studentNumber: string | null;
  group: { code: string } | null;
  user: {
    firstName: string;
    lastName: string;
    middleName: string | null;
    email: string;
    birthDate: string | null;
    emailVerifiedAt: string | null;
    status: string;
  };
};
type Data = {
  requests: RequestItem[];
  teachers: { id: string; name: string }[];
  scheduleTeachers: string[];
};
export function AccountAdmin() {
  if (process.env.NEXT_PUBLIC_PORTAL_DEMO === "1") return <DemoServerOnly />;
  return <LiveAccountAdmin />;
}
function LiveAccountAdmin() {
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    portalRequest<Data>("admin/requests", undefined, controller.signal)
      .then((r) => {
        setData(r);
        setError("");
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        if (e instanceof PortalError && e.status === 401)
          window.location.replace("/login/");
        else setError(e.message);
      });
    return () => controller.abort();
  }, [reload]);
  return (
    <section className="container page-content">
      <span className="eyebrow">АДМИНИСТРАТОР</span>
      <h1>Подтверждение аккаунтов</h1>
      <p>
        Подтверждайте принадлежность после сверки с университетским реестром.
        Совпадение имени с публичным справочником само по себе не доказывает
        личность.
      </p>
      <Link className="text-link" href="/dashboard">
        Вернуться в кабинет →
      </Link>
      {error && (
        <p className="form-feedback form-error" role="alert">
          {error}
        </p>
      )}
      {!data && !error && <p role="status">Загружаем заявки…</p>}
      {data && !data.requests.length && (
        <div className="empty-state">
          <h2>Все заявки обработаны</h2>
        </div>
      )}
      {data?.requests.map((r) => (
        <article className="person-card account-review" key={r.id}>
          <span className="badge">
            {r.requestedRole === "STUDENT" ? "Студент" : "Преподаватель"}
          </span>
          <h2>
            {[r.user.lastName, r.user.firstName, r.user.middleName]
              .filter(Boolean)
              .join(" ")}
          </h2>
          <p>
            {r.user.email} ·{" "}
            {r.user.emailVerifiedAt
              ? "e-mail подтверждён"
              : "e-mail не подтверждён"}
          </p>
          <p>
            Дата рождения: {r.user.birthDate?.slice(0, 10) || "—"} · Группа:{" "}
            {r.group?.code || "—"} · Билет: {r.studentNumber || "—"}
          </p>
          <form
            className="auth-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const v = new FormData(e.currentTarget);
              const decision = String(v.get("decision"));
              if (
                !window.confirm(
                  decision === "APPROVED"
                    ? "Подтверждаете, что принадлежность пользователя проверена по университетскому реестру?"
                    : "Отклонить заявку?",
                )
              )
                return;
              setBusy(true);
              try {
                await portalRequest("admin/review", {
                  id: r.id,
                  decision,
                  note: String(v.get("note") || ""),
                  ...(r.requestedRole === "TEACHER"
                    ? {
                        publicTeacherId: String(v.get("publicTeacherId") || ""),
                        scheduleName: String(v.get("scheduleName") || ""),
                      }
                    : {}),
                });
                setReload((x) => x + 1);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Ошибка");
              } finally {
                setBusy(false);
              }
            }}
          >
            <fieldset className="auth-fields" disabled={busy}>
              {r.requestedRole === "TEACHER" && (
                <>
                  <label>
                    Запись в справочнике преподавателей
                    <select name="publicTeacherId" defaultValue="">
                      <option value="">Выберите после проверки</option>
                      {data.teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Имя в электронном расписании
                    <select name="scheduleName" defaultValue="">
                      <option value="">Не связывать пока</option>
                      {data.scheduleTeachers.map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              <label>
                Комментарий заявителю
                <textarea name="note" maxLength={500} rows={2} />
              </label>
              <label>
                Решение
                <select name="decision" defaultValue="APPROVED">
                  <option value="APPROVED">Подтвердить принадлежность</option>
                  <option value="REJECTED">Отклонить</option>
                </select>
              </label>
              <button type="submit" className="button button-red">
                Сохранить решение
              </button>
            </fieldset>
          </form>
        </article>
      ))}
    </section>
  );
}
