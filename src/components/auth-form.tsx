"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { portalRequest } from "@/lib/account";
import { moscowToday } from "@/lib/filters";
import { DemoAuthForm } from "./demo-auth-form";
export function AuthForm(props: { register?: boolean; reset?: boolean }) {
  if (process.env.NEXT_PUBLIC_PORTAL_DEMO === "1")
    return <DemoAuthForm {...props} />;
  return <LiveAuthForm {...props} />;
}
function LiveAuthForm({
  register = false,
  reset = false,
}: {
  register?: boolean;
  reset?: boolean;
}) {
  const [role, setRole] = useState("STUDENT"),
    [show, setShow] = useState(false),
    [remember, setRemember] = useState(true);
  const tokenRead = useRef(false);
  const [groups, setGroups] = useState<{ id: string; code: string }[]>([]);
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [token, setToken] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    if (reset && !tokenRead.current) {
      tokenRead.current = true;
      const t =
        new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
      queueMicrotask(() => setToken(t));
      if (t) history.replaceState(null, "", window.location.pathname);
    }
    portalRequest<{ groups: { id: string; code: string }[] }>(
      register ? "groups" : "config",
      undefined,
      controller.signal,
    )
      .then((data) => {
        if (register) setGroups(data.groups);
        setReady(true);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    if (!register && !reset)
      portalRequest("me", undefined, controller.signal)
        .then(() => window.location.replace("/dashboard/"))
        .catch(() => {});
    return () => controller.abort();
  }, [register, reset]);
  return (
    <div className="auth-form-wrap">
      <h2>
        {reset
          ? token
            ? "Новый пароль"
            : "Восстановление доступа"
          : register
            ? "Создать аккаунт"
            : "Добро пожаловать"}
      </h2>
      <p>
        {register
          ? "Заполните анкету. Принадлежность к филиалу проверит администратор."
          : reset
            ? "Одноразовая ссылка придёт на e-mail аккаунта."
            : "Войдите по e-mail и паролю портала."}
      </p>
      {register && (
        <div className="tabs account-role-tabs" aria-label="Тип аккаунта">
          {[
            ["STUDENT", "Я студент"],
            ["TEACHER", "Я преподаватель"],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={role === value}
              onClick={() => {
                setRole(value);
                setError("");
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {error && (
        <div className="form-feedback form-error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="form-feedback" role="status">
          {message}
        </div>
      )}
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          setMessage("");
          const form = e.currentTarget,
            values = new FormData(form),
            text = (key: string) => String(values.get(key) || "");
          if (
            (register || token) &&
            text("password") !== text("confirmPassword")
          ) {
            setError("Пароли не совпадают");
            setBusy(false);
            return;
          }
          try {
            const input = reset
              ? token
                ? { token, password: text("password") }
                : { email: text("email") }
              : register
                ? {
                    email: text("email"),
                    password: text("password"),
                    firstName: text("firstName"),
                    lastName: text("lastName"),
                    middleName: text("middleName"),
                    birthDate: text("birthDate"),
                    requestedRole: role,
                    remember,
                    ...(role === "STUDENT"
                      ? {
                          groupId: text("groupId"),
                          studentNumber: text("studentNumber"),
                        }
                      : {}),
                  }
                : {
                    email: text("email"),
                    password: text("password"),
                    remember,
                  };
            const result = await portalRequest<{ message?: string }>(
              reset
                ? token
                  ? "reset-password"
                  : "reset-request"
                : register
                  ? "register"
                  : "login",
              input,
            );
            form.reset();
            if (reset) {
              setMessage(result.message || "Готово");
              if (token) setToken("");
            } else window.location.replace("/dashboard/");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Ошибка запроса");
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset className="auth-fields" disabled={!ready || busy}>
          {register && (
            <>
              <div className="form-grid">
                <label>
                  Фамилия
                  <input
                    name="lastName"
                    required
                    maxLength={80}
                    autoComplete="family-name"
                  />
                </label>
                <label>
                  Имя
                  <input
                    name="firstName"
                    required
                    maxLength={80}
                    autoComplete="given-name"
                  />
                </label>
              </div>
              <label>
                Отчество, если есть
                <input
                  name="middleName"
                  maxLength={80}
                  autoComplete="additional-name"
                />
              </label>
              <label>
                Дата рождения
                <input
                  name="birthDate"
                  type="date"
                  required
                  min="1900-01-01"
                  max={moscowToday()}
                  autoComplete="bday"
                />
              </label>
              {role === "STUDENT" && (
                <>
                  <label>
                    Группа
                    <select name="groupId" required defaultValue="">
                      <option value="" disabled>
                        Выберите группу
                      </option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.code}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Номер студенческого билета
                    <input
                      name="studentNumber"
                      required
                      maxLength={30}
                      autoComplete="off"
                    />
                  </label>
                  <p className="required-note">
                    Если вашей группы нет, обратитесь в учебную часть для
                    добавления в реестр.
                  </p>
                </>
              )}
            </>
          )}
          {!token && (
            <label>
              E-mail
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="username"
                placeholder="name@example.ru"
              />
            </label>
          )}
          {(!reset || token) && (
            <label>
              Пароль
              <div className="password-field">
                <input
                  name="password"
                  type={show ? "text" : "password"}
                  required
                  minLength={register || token ? 12 : 1}
                  maxLength={128}
                  autoComplete={
                    register || token ? "new-password" : "current-password"
                  }
                  placeholder={
                    register || token
                      ? "Не менее 12 символов"
                      : "Введите пароль"
                  }
                />
                <button
                  type="button"
                  aria-label={show ? "Скрыть пароль" : "Показать пароль"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </label>
          )}
          {(register || token) && (
            <label>
              Повторите пароль
              <input
                name="confirmPassword"
                type={show ? "text" : "password"}
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
          )}
          {!reset && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Запомнить это устройство на 30 дней
            </label>
          )}
          {!reset && (
            <p className="required-note">
              На общем компьютере снимите флажок и завершите сеанс после работы.
            </p>
          )}
          {!register && !reset && (
            <Link href="/password-reset">Забыли пароль?</Link>
          )}
          <button className="button button-red" type="submit">
            {busy
              ? "Подождите…"
              : reset
                ? token
                  ? "Установить пароль"
                  : "Отправить ссылку"
                : register
                  ? "Создать аккаунт"
                  : "Войти"}
          </button>
        </fieldset>
      </form>
      {register && (
        <p className="required-note">
          <ShieldCheck size={16} /> Выбор роли не предоставляет доступ к
          оценкам, группам и работам других пользователей.
        </p>
      )}
      <div className="auth-bottom">
        {register || reset ? (
          <Link href="/login">Вернуться ко входу</Link>
        ) : (
          <>
            Впервые здесь? <Link href="/registration">Создать аккаунт</Link>
          </>
        )}
      </div>
    </div>
  );
}
