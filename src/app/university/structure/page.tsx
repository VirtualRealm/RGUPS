import { PageHeading } from "@/components/ui";
import { UniversityNav } from "@/components/university-nav";
import { SourceNote } from "@/components/source-note";
import { StructureBrowser } from "@/components/structure-browser";
export const metadata = { title: "Структура и органы управления" };
export default function Page() {
  return (
    <>
      <PageHeading
        eyebrow="Университет / Структура"
        title="Университет в деталях"
      >
        Органы управления, руководители подразделений, адреса и положения об их
        работе.
      </PageHeading>
      <section className="container page-content">
        <UniversityNav />
        <SourceNote>
          Все 20 позиций из опубликованной{" "}
          <a
            href="https://vfrgups.ru/onas/struktura-i-organy-upravleniya"
            target="_blank"
            rel="noreferrer"
          >
            структуры филиала
          </a>
          : 4 органа управления и 16 подразделений.
        </SourceNote>
        <StructureBrowser />
      </section>
    </>
  );
}
