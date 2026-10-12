import Link from "next/link";
import Image from "next/image";
import { news, type NewsItem } from "@/lib/data";
export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading container">
      <div className="breadcrumbs">
        <Link href="/">Главная</Link>
        <span>/</span>
        {eyebrow}
      </div>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children && <p className="lead">{children}</p>}
    </div>
  );
}
export function NewsCard({ item = news[0] }: { item?: NewsItem }) {
  return (
    <article className="news-card">
      <Link href={`/news/${item.slug}`} className="news-image">
        <Image
          src={item.image}
          alt="Вокзал Воронеж-1 — иллюстрация"
          width={640}
          height={400}
        />
        <span className="image-tag">{item.category}</span>
        <span className="image-credit-label">Иллюстрация</span>
      </Link>
      <div className="news-meta">
        <time dateTime={item.date}>
          {new Intl.DateTimeFormat("ru-RU", {
            day: "numeric",
            month: "long",
            timeZone: "Europe/Moscow",
          }).format(new Date(item.date + "T12:00:00Z"))}
        </time>
        <span>{item.source ? "Событие" : "Демо"}</span>
      </div>
      <h3>
        <Link href={`/news/${item.slug}`}>{item.title}</Link>
      </h3>
      <p>{item.excerpt}</p>
    </article>
  );
}
export function SectionHead({
  eyebrow,
  title,
  href,
  label,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="section-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {label}
        </Link>
      )}
    </div>
  );
}
export function DemoNote({ children }: { children?: React.ReactNode }) {
  return (
    <div className="demo-note">
      <span className="badge">Демо</span>
      {children ??
        "Показаны демонстрационные данные. Перед использованием уточните информацию в филиале."}
    </div>
  );
}
