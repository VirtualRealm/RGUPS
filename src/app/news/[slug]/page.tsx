import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { news } from "@/lib/data";
import { DemoNote } from "@/components/ui";
import { formatDay } from "@/lib/filters";
export function generateStaticParams() {
  return news.map((n) => ({ slug: n.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = news.find((n) => n.slug === slug);
  return { title: item?.title ?? "Новость не найдена" };
}
export default async function NewsArticle({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = news.find((n) => n.slug === slug);
  if (!item) notFound();
  return (
    <article className="container article page-content">
      <div className="breadcrumbs" style={{ paddingTop: 30 }}>
        <Link href="/">Главная</Link>
        <span>/</span>
        <Link href="/news">Новости</Link>
      </div>
      <span className="eyebrow">{item.category}</span>
      <h1>{item.title}</h1>
      <div className="news-meta">
        <time dateTime={item.date}>{formatDay(item.date)}</time>
        <span>
          {item.source ? "Дата события" : "Демонстрационная публикация"}
        </span>
        {item.important && <span>Главное</span>}
      </div>
      <Image
        className="article-cover"
        src={item.image}
        alt={item.title}
        width={1000}
        height={600}
        priority
      />
      {!item.source && (
        <DemoNote>Это пример публикации для проверки интерфейса.</DemoNote>
      )}
      {item.content.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {item.source && (
        <p className="article-source">
          Краткое изложение по материалам{" "}
          <a href={item.source} target="_blank" rel="noreferrer">
            официального сайта филиала
          </a>
          . Фотография используется как иллюстрация; сведения об авторстве — на странице источников.
        </p>
      )}
      <Link className="button button-outline" href="/news">
        Все новости
      </Link>
    </article>
  );
}
