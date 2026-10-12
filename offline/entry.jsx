/* eslint-disable @next/next/no-html-link-for-pages -- Standalone file uses its own hash router. */
import { Component, useEffect, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { Header, Footer } from "../src/components/shell";
import { usePathname, subscribe, locationSnapshot } from "./navigation";
import routes from "offline-routes";
import staticPages from "offline-pages";

window.portalAssets = JSON.parse(
  document.getElementById("portal-assets").textContent,
);
const pdfUrls = new Map();
function openAsset(path) {
  const data = window.portalAssets[path];
  if (!data) return false;
  if (!pdfUrls.has(path)) {
    const [header, base64] = data.split(",");
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    pdfUrls.set(
      path,
      URL.createObjectURL(
        new Blob([bytes], { type: header.slice(5).split(";")[0] }),
      ),
    );
  }
  const popup = window.open(pdfUrls.get(path), "_blank", "noopener,noreferrer");
  void popup;
  return true;
}
function scrollToFragment(fragment) {
  if (fragment)
    document
      .getElementById(decodeURIComponent(fragment))
      ?.scrollIntoView({ behavior: "smooth" });
  else window.scrollTo(0, 0);
}
document.addEventListener("click", (event) => {
  const anchor = event.target.closest?.("a[href]");
  if (
    !anchor ||
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const href = anchor.getAttribute("href");
  if (href.startsWith("#") && !href.startsWith("#/")) {
    event.preventDefault();
    scrollToFragment(href.slice(1));
    return;
  }
  if (!href.startsWith("/") || href.startsWith("//")) return;
  event.preventDefault();
  if (openAsset(href)) return;
  const route = href.replace(/\/(?=[?#]|$)/, "") || "/";
  if (locationSnapshot() === route) scrollToFragment(route.split("#")[1]);
  else window.location.hash = route;
});

class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="container page-content">
        <h1>Не удалось открыть страницу</h1>
        <p>Обновите файл или вернитесь на главную.</p>
        <a className="button button-red" href="/">
          На главную
        </a>
      </div>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const path = usePathname();
  const location = useSyncExternalStore(subscribe, locationSnapshot, () => "/");
  const Page = routes[path];
  const saved = staticPages[path];
  useEffect(() => {
    document.title =
      (saved?.title || "РГУПС · Воронеж") + " — локальная демонстрация";
    scrollToFragment(location.split("#")[1]);
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [path, saved, location]);
  return (
    <>
      <div className="offline-banner">
        <div className="container">
          <strong>Локальная демонстрация</strong>
          <span>Снимок данных: 11.10.2026</span>
          <details>
            <summary>Что работает</summary>
            <p>
              Все страницы, поиск, фильтры, профили преподавателей, календарь
              ВО, заочные сессии, замены СПО и 9 PDF работают без интернета.
              Вход и регистрация — проверка демоформ без создания аккаунта.
              Официальные сайты, почта и онлайн-карты открываются при наличии
              интернета. Основное расписание СПО источник пока не отдаёт.
            </p>
          </details>
        </div>
      </div>
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>
      <Header key={path} />
      <main id="main" tabIndex={-1}>
        <ErrorBoundary key={path}>
          {Page ? (
            <Page />
          ) : saved ? (
            <div dangerouslySetInnerHTML={{ __html: saved.html }} />
          ) : (
            <div className="container page-content">
              <h1>Страница не найдена</h1>
              <a href="/">На главную</a>
            </div>
          )}
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
