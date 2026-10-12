import Link from "next/link";
import { notFound } from "next/navigation";
import { additionalPrograms } from "@/lib/data";
import { PageHeading } from "@/components/ui";
export function generateStaticParams() {
  return additionalPrograms.map((p) => ({ slug: p.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: additionalPrograms.find((p) => p.id === slug)?.title ?? "Программа",
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = additionalPrograms.find((p) => p.id === slug);
  if (!p) notFound();
  return (
    <>
      <PageHeading eyebrow="Дополнительное образование" title={p.title}>
        {p.description}
      </PageHeading>
      <section className="container page-content">
        <div className="info-grid">
          <div className="info-card">
            <h2>О направлении</h2>
            <p>
              Программы для специалистов транспортной отрасли. Конкретная
              программа, учебный план и требования к слушателям определяются
              центром дополнительного образования.
            </p>
          </div>
          <div className="info-card">
            <h2>Формат и сроки</h2>
            <p>
              Продолжительность, формат обучения, преподаватели и даты
              ближайшего набора уточняются для выбранной программы.
            </p>
            <a href="https://do.vfrgups.ru/" target="_blank" rel="noreferrer">
              Действующий каталог ЦДО
            </a>
          </div>
          <div className="info-card">
            <h2>Обсудить обучение</h2>
            <p>Воронеж, ул. Урицкого, 75-А, корпус 1.</p>
            <a href="tel:+74732654446">+7 (473) 265-44-46</a>
            <br />
            <a href="mailto:cdo@vfrgups.ru">cdo@vfrgups.ru</a>
          </div>
        </div>
        <div className="prose">
          <h2>Документы и учебные материалы</h2>
          <p>
            Утверждённые программы, документы и материалы будут добавлены после
            переноса данных. Текущая система обучения продолжает работать.
          </p>
        </div>
        <Link className="button button-outline" href="/education/additional">
          Все направления ДПО
        </Link>
      </section>
    </>
  );
}
