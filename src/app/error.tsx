"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container error-panel">
      <div className="error-number">500</div>
      <h1>Не удалось загрузить страницу</h1>
      <p>Попробуйте ещё раз через несколько секунд.</p>
      <button className="button button-red" onClick={reset}>
        Повторить
      </button>
    </div>
  );
}
