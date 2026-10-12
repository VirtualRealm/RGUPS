export default function Loading() {
  return (
    <div
      className="container page-content"
      role="status"
      aria-label="Загрузка страницы"
    >
      <div className="skeleton skeleton-title" />
      <div className="news-grid">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <span className="sr-only">Загрузка…</span>
    </div>
  );
}
