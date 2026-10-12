import Link from "next/link";
import { PageHeading } from "@/components/ui";
import { UniversityNav } from "@/components/university-nav";
import { SourceNote } from "@/components/source-note";
import management from "@/content/management.json";
export const metadata = { title: "Руководство филиала и университета" };
function Person({ person }: { person: (typeof management.branch)[number] }) {
  return (
    <article className="person-card">
      <div className="person-top">
        <span className="person-avatar" aria-hidden="true">
          {person.name
            .split(" ")
            .slice(0, 2)
            .map((s) => s[0])
            .join("")}
        </span>
        <div>
          <span className="person-role">{person.position}</span>
          <h3>{person.name}</h3>
        </div>
      </div>
      {person.qualification && <p>{person.qualification}</p>}
      <dl className="fact-list">
        {person.office && (
          <div>
            <dt>Кабинет</dt>
            <dd>{person.office}</dd>
          </div>
        )}
        {person.reception && (
          <div>
            <dt>Личный приём</dt>
            <dd>{person.reception}</dd>
          </div>
        )}
        <div>
          <dt>Телефон</dt>
          <dd>{person.phone}</dd>
        </div>
        <div>
          <dt>Электронная почта</dt>
          <dd>
            <a href={`mailto:${person.email}`}>{person.email}</a>
          </dd>
        </div>
      </dl>
      <a
        className="text-link"
        href={person.sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        Сведения на официальном сайте
      </a>
    </article>
  );
}
export default function Page() {
  return (
    <>
      <PageHeading
        eyebrow="Университет / Руководство"
        title="Люди, которые развивают университет"
      >
        Руководство Воронежского филиала и ректорат головного университета.
      </PageHeading>
      <section className="container page-content">
        <UniversityNav />
        <SourceNote>
          <a
            href="https://vfrgups.ru/onas/rukovodstvo"
            target="_blank"
            rel="noreferrer"
          >
            Руководство филиала
          </a>{" "}
          ·{" "}
          <a
            href="https://bypass.rgups.ru/university/struktura-i-organy-upravleniia-1632/managers/"
            target="_blank"
            rel="noreferrer"
          >
            Ректорат РГУПС
          </a>
          . Контактные данные приведены из открытых служебных сведений.
        </SourceNote>
        <div className="directory-heading">
          <span className="eyebrow">ВОРОНЕЖ</span>
          <h2>Руководство филиала</h2>
          <p>Улица Урицкого, 75а</p>
        </div>
        <div className="directory-grid">
          {management.branch.map((p) => (
            <Person key={p.id} person={p} />
          ))}
        </div>
        <div className="directory-heading">
          <span className="eyebrow">ГОЛОВНОЙ УНИВЕРСИТЕТ · РОСТОВ-НА-ДОНУ</span>
          <h2>Ректорат РГУПС</h2>
          <p>Площадь Ростовского Стрелкового Полка Народного Ополчения, 2</p>
        </div>
        <div className="directory-grid">
          {management.rectorate.map((p) => (
            <Person key={p.id} person={p} />
          ))}
        </div>
        <div className="empty-inline" style={{ marginTop: 32 }}>
          <div>
            <h3>Руководители всех подразделений</h3>
            <p>
              Учебные отделы, кафедра, библиотека, центр дополнительного
              образования и общежития.
            </p>
          </div>
          <Link className="text-link" href="/university/structure">
            Открыть структуру
          </Link>
        </div>
      </section>
    </>
  );
}
