import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/ui";
import { UniversityNav } from "@/components/university-nav";
import { SourceNote } from "@/components/source-note";
import { teachers } from "@/lib/teachers";
export function generateStaticParams() {
  return teachers.map((t) => ({ id: t.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return { title: teachers.find((t) => t.id === id)?.name ?? "Преподаватель" };
}
function Training({ title, items }: { title: string; items: string[] }) {
  const values = items.filter((x) => x.trim() !== "-" && x.trim() !== "");
  return (
    <section className="content-block">
      <h2>{title}</h2>
      {values.length ? (
        <ul>
          {values.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      ) : (
        <p>В опубликованном реестре сведения не указаны.</p>
      )}
    </section>
  );
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = teachers.find((x) => x.id === id);
  if (!t) notFound();
  return (
    <>
      <PageHeading eyebrow="Университет / Преподаватели" title={t.name}>
        {t.position} · {t.levels.join(" / ")}
      </PageHeading>
      <section className="container page-content">
        <UniversityNav />
        <SourceNote>
          Профессиональные сведения из открытых реестров филиала. Значения стажа
          и квалификации приведены в формулировках источника.
        </SourceNote>
        <div className="teacher-profile-grid">
          <article className="person-card">
            <span className="eyebrow">ОБРАЗОВАНИЕ И КВАЛИФИКАЦИЯ</span>
            <dl className="fact-list">
              <div>
                <dt>Образование</dt>
                <dd>{t.education}</dd>
              </div>
              <div>
                <dt>Учёная степень</dt>
                <dd>{t.degree}</dd>
              </div>
              <div>
                <dt>Учёное звание</dt>
                <dd>{t.title}</dd>
              </div>
              <div>
                <dt>Опыт в профессиональной сфере</dt>
                <dd>
                  {t.experienceYears === ""
                    ? "Не указан"
                    : t.experienceYears + " лет (по реестру)"}
                </dd>
              </div>
            </dl>
          </article>
          <article className="person-card">
            <span className="eyebrow">ОБРАЗОВАТЕЛЬНЫЕ ПРОГРАММЫ</span>
            <ul className="profile-programs">
              {t.programs.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <Link className="text-link" href="/education">
              Каталог образования →
            </Link>
          </article>
        </div>
        <section className="content-block">
          <h2>Дисциплины и практики</h2>
          <p>
            Назначения по каждой образовательной программе сохранены отдельно.
          </p>
          {t.assignments.map((a) => (
            <details key={a.sourceId}>
              <summary>{a.program}</summary>
              <p>{a.position}</p>
              <ul>
                {a.disciplines.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <a
                className="document-link"
                href={a.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Оригинал реестра · запись {a.sourceRow} ↗
              </a>
            </details>
          ))}
        </section>
        <Training title="Повышение квалификации" items={t.training} />
        <Training
          title="Профессиональная переподготовка"
          items={t.retraining}
        />
        <div className="toolbar">
          <Link className="button button-outline" href="/university/teachers">
            Все преподаватели
          </Link>
          <Link className="button button-outline" href="/schedule">
            Расписание
          </Link>
        </div>
      </section>
    </>
  );
}
