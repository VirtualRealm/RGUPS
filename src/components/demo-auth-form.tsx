"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Eye, EyeOff } from "lucide-react";
import { groups } from "@/lib/data";
import { DemoNote } from "./ui";
const subscribeHydration = () => () => {};
export function DemoAuthForm({
  register = false,
  reset = false,
}: {
  register?: boolean;
  reset?: boolean;
}) {
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  const [role, setRole] = useState("student");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <div className="auth-form-wrap">
      <h2>
        {reset
          ? "Восстановление доступа"
          : register
            ? "Активировать аккаунт"
            : "Добро пожаловать"}
      </h2>
      <p>
        {reset
          ? "Вернитесь в своё учебное пространство."
          : register
            ? "Выберите вашу роль в университете."
            : "Войдите в своё учебное пространство."}
      </p>
      <DemoNote>
        Интерфейс будущего кабинета. Данные не отправляются и не сохраняются.
        Используйте вымышленные данные.
      </DemoNote>
      {register && (
        <div
          className="tabs"
          style={{ marginBottom: 24 }}
          aria-label="Тип аккаунта"
        >
          <button
            aria-pressed={role === "student"}
            onClick={() => {
              setRole("student");
              setMessage("");
            }}
          >
            Я студент
          </button>
          <button
            aria-pressed={role === "teacher"}
            onClick={() => {
              setRole("teacher");
              setMessage("");
            }}
          >
            Я преподаватель
          </button>
        </div>
      )}
      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(
            reset
              ? "Восстановление ещё не подключено. Письмо не отправлено."
              : register
                ? "Форма проверена. На следующем этапе заявка будет проходить проверку принадлежности к филиалу. Сейчас аккаунт не создан."
                : "Авторизация будет подключена на следующем этапе. Вход не выполнен.",
          );
          e.currentTarget.reset();
        }}
      >
        <fieldset className="auth-fields" disabled={!hydrated}>
          {register && (
            <>
              <div className="form-grid">
                <label>
                  Фамилия
                  <input
                    required
                    maxLength={80}
                    autoComplete="off"
                    placeholder="Иванов"
                  />
                </label>
                <label>
                  Имя
                  <input
                    required
                    maxLength={80}
                    autoComplete="off"
                    placeholder="Иван"
                  />
                </label>
              </div>
              <label>
                Отчество (если есть)
                <input
                  maxLength={80}
                  autoComplete="off"
                  placeholder="Иванович"
                />
              </label>
              <label>
                Дата рождения
                <input
                  type="date"
                  required
                  min="1900-01-01"
                  max="2026-10-09"
                  autoComplete="off"
                />
              </label>
              {role === "student" && (
                <div className="form-grid">
                  <label>
                    Группа
                    <select required defaultValue="">
                      <option value="" disabled>
                        Выберите группу
                      </option>
                      {groups.map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Студенческий билет
                    <input
                      required
                      maxLength={30}
                      autoComplete="off"
                      placeholder="Номер билета"
                    />
                  </label>
                </div>
              )}
            </>
          )}
          <label>
            E-mail
            <input
              type="email"
              required
              maxLength={254}
              autoComplete="off"
              placeholder="name@example.ru"
            />
          </label>
          {!reset && (!register || role === "teacher") && (
            <label>
              Пароль
              <div className="password-field">
                <input
                  type={show ? "text" : "password"}
                  required
                  minLength={register ? 12 : 1}
                  maxLength={128}
                  autoComplete="off"
                  placeholder={
                    register ? "Не менее 12 символов" : "Введите пароль"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Скрыть пароль" : "Показать пароль"}
                >
                  {show ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </label>
          )}
          {register && (
            <p className="required-note">
              {role === "teacher"
                ? "Доступ преподавателя потребует приглашения или подтверждения администратора."
                : "Доступ студента потребует сверки с реестром и подтверждения e-mail."}{" "}
              Выбор роли сам по себе не даёт прав доступа.
            </p>
          )}
          {!register && !reset && (
            <Link
              href="/password-reset"
              style={{ fontSize: 13, alignSelf: "end" }}
            >
              Забыли пароль?
            </Link>
          )}
          <button className="button button-red" type="submit">
            {reset
              ? "Проверить форму восстановления"
              : register
                ? "Проверить анкету"
                : "Войти"}
          </button>
          {message && (
            <div className="form-feedback" role="status">
              {message}
            </div>
          )}
        </fieldset>
      </form>
      <div className="auth-bottom">
        {register || reset ? (
          <Link href="/login">Вернуться ко входу</Link>
        ) : (
          <>
            Впервые здесь?{" "}
            <Link href="/registration">Активировать аккаунт</Link>
          </>
        )}
      </div>
    </div>
  );
}
