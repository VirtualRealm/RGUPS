"use client";
import { useState } from "react";
import { Search, Newspaper } from "lucide-react";
import { NewsCard } from "@/components/ui";
import { news } from "@/lib/data";
import { filterNews } from "@/lib/filters";
export function NewsBrowser() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("Все");
  const [page, setPage] = useState(1);
  const filtered = filterNews(news, q, category);
  const count = Math.ceil(filtered.length / 3);
  return (
    <>
      <div className="toolbar">
        <div className="search-field">
          <Search size={19} />
          <input
            aria-label="Поиск новостей"
            placeholder="Найти новость"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="tabs" aria-label="Рубрики новостей">
          {["Все", ...new Set(news.map((n) => n.category))].map((c) => (
            <button
              key={c}
              aria-pressed={c === category}
              onClick={() => {
                setCategory(c);
                setPage(1);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <p className="result-count" aria-live="polite">
        Найдено публикаций: {filtered.length}
      </p>
      {filtered.length ? (
        <div className="news-grid">
          {filtered.slice((page - 1) * 3, page * 3).map((n) => (
            <NewsCard key={n.slug} item={n} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Newspaper />
          <h2>Ничего не найдено</h2>
          <p>Измените запрос или выберите другую рубрику.</p>
          <button
            className="button button-outline"
            onClick={() => {
              setQ("");
              setCategory("Все");
              setPage(1);
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      )}
      {count > 1 && (
        <nav className="pagination" aria-label="Страницы новостей">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            aria-label="Предыдущая страница"
          >
            Назад
          </button>
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              aria-current={page === i + 1 ? "page" : undefined}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page === count}
            onClick={() => setPage(page + 1)}
            aria-label="Следующая страница"
          >
            Далее
          </button>
        </nav>
      )}
    </>
  );
}
