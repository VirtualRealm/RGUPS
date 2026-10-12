import { PageHeading } from "@/components/ui";
import { ProgramBrowser } from "@/components/program-browser";
export const metadata = { title: "Дополнительное образование" };
export default function Page() {
  return (
    <>
      <PageHeading
        eyebrow="Дополнительное образование"
        title="Следующий шаг в профессии"
      >
        Развивайте компетенции и осваивайте новые направления вместе с центром
        дополнительного образования РГУПС.
      </PageHeading>
      <section className="container page-content">
        <ProgramBrowser additional />
        <div className="empty-inline" style={{ marginTop: 35 }}>
          <div>
            <h3>Поможем выбрать программу</h3>
            <p>Продолжительность, даты обучения и стоимость уточняйте в ЦДО.</p>
          </div>
          <a className="text-link" href="tel:+74732654446">
            +7 (473) 265-44-46
          </a>
        </div>
      </section>
    </>
  );
}
