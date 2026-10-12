import Link from "next/link";
import { PageHeading } from "@/components/ui";
import { EducationCatalog } from "@/components/education-catalog";
import { SourceNote } from "@/components/source-note";
export const metadata = { title: "Образование" };
export default function Page() {
  return (
    <>
      <PageHeading eyebrow="Образование" title="Найди своё направление">
        От первой профессии до инженерной квалификации. Образование для
        транспортной отрасли и твоего будущего.
      </PageHeading>
      <section id="spo" className="container page-content">
        <SourceNote>
          ВО: 2 специальности очно и 4 заочно. СПО: 7 специальностей, 8 профилей
          в плане приёма 2026 года. Программы прежних наборов отмечены отдельно.{" "}
          <a
            href="https://vfrgups.ru/spetsialnosti-spo"
            target="_blank"
            rel="noreferrer"
          >
            СПО
          </a>{" "}
          ·{" "}
          <a
            href="https://vfrgups.ru/sveden_docs/ktcp_vo_s_kvotami_filialy_15-04-2026.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Высшее образование
          </a>
          .
        </SourceNote>
        <div className="directory-grid content-block">
          <article className="info-card">
            <span className="eyebrow">ВО · ОЧНЫЙ СПЕЦИАЛИТЕТ · 23.05.04</span>
            <h2>Эксплуатация железных дорог</h2>
            <p>Управление перевозками и работой железнодорожного транспорта.</p>
            <Link className="text-link" href="/education/programs/vo-230504">
              Программа и условия приёма →
            </Link>
          </article>
          <article className="info-card">
            <span className="eyebrow">ВО · ОЧНЫЙ СПЕЦИАЛИТЕТ · 23.05.06</span>
            <h2>
              Строительство железных дорог, мостов и транспортных тоннелей
            </h2>
            <p>
              Проектирование, строительство и содержание транспортной
              инфраструктуры.
            </p>
            <Link className="text-link" href="/education/programs/vo-230506">
              Программа и условия приёма →
            </Link>
          </article>
        </div>
        <EducationCatalog />
        <div className="empty-inline" style={{ marginTop: 35 }}>
          <div>
            <h3>Продолжайте профессиональный рост</h3>
            <p>
              Переподготовка, повышение квалификации и программы подготовки.
            </p>
          </div>
          <Link className="text-link" href="/education/additional">
            Дополнительное образование
          </Link>
        </div>
        <p className="result-count" style={{ marginTop: 20 }}>
          Число мест и сроки относятся к кампании 2026 года. Информация о новом
          наборе обновляется после публикации официальных документов.
        </p>
      </section>
    </>
  );
}
