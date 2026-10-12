"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { portalRequest } from "@/lib/account";
import { DemoServerOnly } from "./account-demo";
export function VerifyEmail() {
  if (process.env.NEXT_PUBLIC_PORTAL_DEMO === "1") return <DemoServerOnly />;
  return <LiveVerifyEmail />;
}
function LiveVerifyEmail() {
  const [token, setToken] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const tokenRead = useRef(false);
  useEffect(() => {
    if (tokenRead.current) return;
    tokenRead.current = true;
    const t =
      new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
    queueMicrotask(() => setToken(t));
    history.replaceState(null, "", window.location.pathname);
  }, []);
  return (
    <section className="container page-content">
      <div className="person-card">
        <h1>Подтверждение e-mail</h1>
        <p>
          Подтверждение адреса не заменяет проверку принадлежности к
          университету.
        </p>
        {token ? (
          <button
            disabled={busy}
            className="button button-red"
            onClick={async () => {
              setBusy(true);
              try {
                const r = await portalRequest<{ message: string }>(
                  "verify-email",
                  { token },
                );
                setMessage(r.message);
                setToken("");
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "Ошибка");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Проверяем…" : "Подтвердить e-mail"}
          </button>
        ) : (
          <p>
            Откройте одноразовую ссылку из письма или запросите новую в
            кабинете.
          </p>
        )}
        {message && <p role="status">{message}</p>}
        <Link className="text-link" href="/dashboard">
          Перейти в личный кабинет →
        </Link>
      </div>
    </section>
  );
}
