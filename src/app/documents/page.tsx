import { PageHeading } from "@/components/ui";
export const metadata = { title: "Документы" };
export default function Page() {
  return (
    <>
      <PageHeading eyebrow="Документы" title="Открыто и доступно">
        Официальная информация об образовательной организации.
      </PageHeading>
      <section className="container page-content prose">
        <p>
          В первой версии портала документы доступны на действующем официальном
          сайте филиала. Перенос будет выполнен с сохранением названий, дат
          утверждения и актуальных редакций.
        </p>
        <h2>Сведения об образовательной организации</h2>
        <p>
          Основные сведения, структура, документы, образование, образовательные
          стандарты и материально-техническое обеспечение.
        </p>
        <a
          className="button button-outline"
          href="https://bypass.rgups.ru/filiali/voronezh/"
          target="_blank"
          rel="noreferrer"
        >
          Перейти к официальным сведениям
        </a>
        <h2>Учебная документация</h2>
        <p>
          Положения и учебные материалы необходимо сверять с актуальной версией
          на сайте филиала.
        </p>
        <a href="https://vfrgups.ru/" target="_blank" rel="noreferrer">
          Официальный сайт РГУПС · Воронеж
        </a>
      </section>
    </>
  );
}
