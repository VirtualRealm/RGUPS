import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/ui";
import { SourceNote } from "@/components/source-note";
import data from "@/content/programs.json";
export function generateStaticParams() {
  return data.programs.map((p) => ({ id: p.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title: data.programs.find((p) => p.id === id)?.title ?? "Программа",
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = data.programs.find((x) => x.id === id);
  if (!p) notFound();
  return (
    <>
      <PageHeading eyebrow={`Образование / ${p.code}`} title={p.title}>
        {p.kind} · {p.description}
      </PageHeading>
      <section className="container page-content">
        <SourceNote>
          {p.admissionStatus}. Данные о местах — утверждённый план кампании 2026
          года, а не остаток свободных мест.
        </SourceNote>
        <div className="info-grid">
          <div className="info-card">
            <h2>Форма обучения</h2>
            <p>{p.forms.join(" / ")}</p>
          </div>
          <div className="info-card">
            <h2>Срок обучения</h2>
            <p>{p.duration}</p>
            {p.level === "ВО" && p.forms.includes("Очная") && (
              <p>
                Срок очной программы уточняется по учебному плану выбранного
                набора.
              </p>
            )}
          </div>
          <div className="info-card">
            <h2>Основание</h2>
            <p>{p.basis}</p>
          </div>
        </div>
        {p.profiles.length > 0 && (
          <section className="content-block">
            <h2>Профили и специализации</h2>
            <ul>
              {p.profiles.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
        )}
        {p.places.length > 0 && (
          <section className="content-block">
            <h2>Места в 2026 году</h2>
            <div className="table-scroll">
              <table className="content-table">
                <thead>
                  <tr>
                    <th>Форма и основание</th>
                    <th>Бюджет</th>
                    <th>Платно</th>
                  </tr>
                </thead>
                <tbody>
                  {p.places.map((r, i) => (
                    <tr key={i}>
                      <td>
                        {r.form}
                        {"basis" in r && <small>{r.basis}</small>}
                        {"profile" in r && <small>{r.profile}</small>}
                      </td>
                      <td>
                        {r.budget}
                        {"general" in r && (
                          <small>
                            Общий конкурс: {r.general}; целевая квота:{" "}
                            {r.target}; отдельная: {r.separate}; особая:{" "}
                            {r.special}.
                          </small>
                        )}
                      </td>
                      <td>{r.paid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Квоты входят в общее количество бюджетных мест. Право на квоту
              подтверждается документами.
            </p>
          </section>
        )}
        <section className="content-block">
          <h2>Поступление и документы</h2>
          <p>
            {p.admission2026
              ? p.level === "ВО"
                ? "Поступление по результатам ЕГЭ или вступительных испытаний для предусмотренных правилами категорий. Условия, сроки и документы приведены в разделе абитуриента."
                : "Приём на базе основного общего или среднего общего образования. При превышении количества мест проводится конкурс документов об образовании по правилам приёма."
              : "Эта программа сохранена для студентов прежних наборов. Для поступления выберите действующую программу в каталоге."}
          </p>
          <div className="toolbar">
            <Link className="button button-red" href="/admissions">
              Все условия поступления
            </Link>
            <Link className="button button-outline" href="/education">
              Вернуться в каталог
            </Link>
          </div>
        </section>
        <section className="content-block">
          <h2>Официальные источники</h2>
          {p.sources.map((url, i) => (
            <a
              className="document-link"
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              {i === 0
                ? "Описание образовательной программы"
                : i === 1
                  ? "План приёма и количество мест"
                  : "Учебные планы и сведения о программе"}{" "}
              ↗
            </a>
          ))}
        </section>
      </section>
    </>
  );
}
