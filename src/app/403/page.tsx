import Link from "next/link";
export const metadata = { title: "Доступ ограничен" };
export default function Page() {
  return (
    <div className="container error-panel">
      <div className="error-number">403</div>
      <h1>Доступ ограничен</h1>
      <p>Для этого раздела потребуется подтверждённый аккаунт.</p>
      <Link className="button button-red" href="/login">
        К форме входа
      </Link>
    </div>
  );
}
