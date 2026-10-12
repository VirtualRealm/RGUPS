import Link from "next/link";
import { PageHeading } from "@/components/ui";
import { SourceNote } from "@/components/source-note";
import data from "@/content/admissions.json";
import programs from "@/content/programs.json";
export const metadata = { title: "Поступление: ВО и СПО — 2026" };
function SourceLinks({ urls }: { urls: string[] }) {
  return (
    <div className="schedule-file-links">
      {urls.map((url, i) => (
        <a key={url} href={url} target="_blank" rel="noreferrer">
          Официальный источник {urls.length > 1 ? i + 1 : ""} ↗
        </a>
      ))}
    </div>
  );
}
export default function Page() {
  return (
    <>
      <PageHeading eyebrow="Абитуриенту" title="Твой путь начинается здесь">
        Высшее и среднее профессиональное образование: программы, документы,
        экзамены, конкурс и зачисление.
      </PageHeading>
      <section className="container page-content">
        <SourceNote>{data.notice}</SourceNote>
        <nav className="section-nav" aria-label="Условия поступления">
          <a href="#programs">Направления и места</a>
          <a href="#exams">Экзамены</a>
          <a href="#documents">Документы</a>
          <a href="#dates">Сроки</a>
          <a href="#conditions">Все условия</a>
          <a href="#commission">Приёмная комиссия</a>
          <a href="#official">Правила и приказы</a>
        </nav>
        <div id="programs" className="info-grid admissions-overview">
          {[
            {
              level: "ВО",
              title: "2 очные специальности",
              description:
                "Эксплуатация и строительство железных дорог. Заочно доступны 4 специальности. Места ниже — суммарно по обеим формам.",
              budget: programs.totals2026.voBudget,
              paid: programs.totals2026.voPaid,
            },
            {
              level: "СПО",
              title: "7 специальностей",
              description:
                "8 профилей подготовки. На 23.02.06 — отдельно локомотивы и вагоны.",
              budget: programs.totals2026.spoBudget,
              paid: programs.totals2026.spoPaid,
            },
          ].map((s) => (
            <div className="info-card" key={s.level}>
              <span className="eyebrow">
                {s.level === "ВО"
                  ? "ВЫСШЕЕ ОБРАЗОВАНИЕ"
                  : "СРЕДНЕЕ ПРОФЕССИОНАЛЬНОЕ"}
              </span>
              <h2>{s.title}</h2>
              <p>{s.description}</p>
              <div className="directory-stats">
                <div>
                  <strong>{s.budget}</strong>
                  <span>бюджетных мест</span>
                </div>
                <div>
                  <strong>{s.paid}</strong>
                  <span>платных мест</span>
                </div>
              </div>
              <Link href="/education">Программы, сроки и квоты →</Link>
            </div>
          ))}
        </div>
        <section id="exams" className="content-block">
          <span className="eyebrow">ВЫСШЕЕ ОБРАЗОВАНИЕ</span>
          <h2>Вступительные испытания</h2>
          <p>{data.examNotes}</p>
          <div className="score-grid">
            {data.minimumScores.map((s) => (
              <div key={s.subject}>
                <strong>{s.score}</strong>
                <span>{s.subject}</span>
              </div>
            ))}
          </div>
          {data.sections
            .find((s) => s.id === "vo-exams")
            ?.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          <p>
            Для профильных внутренних испытаний на базе профессионального
            образования минимум — 40 баллов по каждому профильному испытанию.
            Минимум по русскому языку — 36.
          </p>
          <SourceLinks urls={[data.resources[0].url]} />
        </section>
        <section id="documents" className="content-block">
          <span className="eyebrow">ПОДГОТОВЬ ЗАРАНЕЕ</span>
          <h2>Документы для поступления</h2>
          <div className="directory-grid">
            {data.documents.map((d) => (
              <article className="person-card" key={d.level}>
                <h3>
                  {d.level === "ВО"
                    ? "Высшее образование"
                    : "Среднее профессиональное"}
                </h3>
                <ul>
                  {d.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p>{d.note}</p>
                <SourceLinks urls={[d.source]} />
              </article>
            ))}
          </div>
        </section>
        <section id="dates" className="content-block">
          <span className="eyebrow">КАЛЕНДАРЬ КАМПАНИИ 2026</span>
          <h2>Когда подавать документы</h2>
          <p>
            Все даты относятся к 2026 году. Время — московское. Дополнительный
            приём проводится только при его официальном объявлении.
          </p>
          {data.timelines.map((t, i) => (
            <details
              className="admission-timeline"
              key={t.category}
              open={i === 0}
            >
              <summary>
                {t.level} · {t.category}
              </summary>
              <div className="table-scroll">
                <table className="content-table">
                  <thead>
                    <tr>
                      <th>Срок</th>
                      <th>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.events.map((e) => (
                      <tr key={e.date + e.label}>
                        <td>{e.date}</td>
                        <td>{e.label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <SourceLinks urls={[t.source]} />
            </details>
          ))}
        </section>
        <section id="conditions" className="content-block">
          <span className="eyebrow">ОТ ЗАЯВЛЕНИЯ ДО ПРИКАЗА</span>
          <h2>Условия поступления</h2>
          {data.sections
            .filter((s) => s.id !== "vo-exams")
            .map((s) => (
              <details key={s.id} id={s.id}>
                <summary>{s.title}</summary>
                {s.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                <SourceLinks urls={s.sources} />
              </details>
            ))}
        </section>
        <section id="commission" className="content-block">
          <span className="eyebrow">ПОМОЖЕМ РАЗОБРАТЬСЯ</span>
          <h2>Приёмная комиссия</h2>
          <div className="directory-grid">
            {data.contacts.map((c) => (
              <article className="person-card" key={c.level}>
                <h3>
                  {c.level === "ВО"
                    ? "Высшее образование"
                    : "Среднее профессиональное образование"}
                </h3>
                <dl className="fact-list">
                  <div>
                    <dt>Адрес</dt>
                    <dd>{c.address}</dd>
                  </div>
                  <div>
                    <dt>Телефоны</dt>
                    <dd>
                      {c.phones.map((phone) => (
                        <div key={phone}>{phone}</div>
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt>Режим комиссии</dt>
                    <dd>{c.hours}</dd>
                  </div>
                </dl>
                <SourceLinks urls={[c.source]} />
              </article>
            ))}
          </div>
          <p>
            Режим работы указан для приёмной кампании. Перед личным визитом
            уточните часы по телефону.
          </p>
        </section>
        <section id="official" className="content-block">
          <span className="eyebrow">ПОЛНЫЕ ТЕКСТЫ</span>
          <h2>Правила, места, стоимость и договоры</h2>
          <p>
            Для отдельных категорий поступающих и особых случаев используйте
            полный текст утверждённых правил.
          </p>
          <div className="directory-grid">
            {data.resources.map((r) => (
              <a
                className="document-tile"
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noreferrer"
              >
                <span>{r.title}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
