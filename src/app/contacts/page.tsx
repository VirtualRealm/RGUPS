import { PageHeading } from "@/components/ui";
export const metadata = { title: "Контакты" };
export default function Page() {
  return (
    <>
      <PageHeading eyebrow="Контакты" title="Увидимся в Воронеже">
        Свяжитесь с филиалом — поможем найти нужную информацию.
      </PageHeading>
      <section className="container page-content contact-layout">
        <div className="contact-details">
          <span className="eyebrow">ФИЛИАЛ РГУПС В ГОРОДЕ ВОРОНЕЖ</span>
          <h2>ул. Урицкого, 75а</h2>
          <a href="tel:+74732211814">+7 (473) 221-18-14</a>
          <a href="tel:+74732652303">+7 (473) 265-23-03</a>
          <a href="mailto:voronezh@rgups.ru">voronezh@rgups.ru</a>
          <h2>Дополнительное образование</h2>
          <p>ул. Урицкого, 75-А, корпус 1</p>
          <a href="tel:+74732654446">+7 (473) 265-44-46</a>
          <a href="mailto:cdo@vfrgups.ru">cdo@vfrgups.ru</a>
          <p className="result-count">
            Перед визитом уточните время работы по телефону.
          </p>
        </div>
        <div className="map-panel">
          <iframe
            title="Карта: РГУПС, Воронеж, Урицкого 75а"
            loading="lazy"
            referrerPolicy="no-referrer"
            src="https://maps.google.com/maps?q=РГУПС%20Воронеж%20Урицкого%2075а&output=embed"
          />
          <a
            href="https://yandex.ru/maps/?text=Воронеж%20Урицкого%2075а"
            target="_blank"
            rel="noreferrer"
          >
            Построить маршрут в Яндекс Картах
          </a>
        </div>
      </section>
    </>
  );
}
