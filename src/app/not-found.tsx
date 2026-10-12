import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container error-panel">
      <div className="error-number">404</div>
      <h1>Кажется, вы свернули с пути</h1>
      <p>Эта страница не найдена. Продолжите с главной страницы.</p>
      <Link className="button button-red" href="/">
        На главную
      </Link>
    </div>
  );
}
