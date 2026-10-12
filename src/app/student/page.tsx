import Link from "next/link";
import { CalendarDays, BookOpen, FileText } from "lucide-react";
import { PageHeading } from "@/components/ui";
export const metadata = { title: "Студенту" };
export default function Page() {
  return (
    <>
      <PageHeading eyebrow="Студенту" title="Всё для учебного дня">
        Расписание, образовательные ресурсы и важные документы — в одном месте.
      </PageHeading>
      <section className="container page-content">
        <div className="info-grid">
          <div className="info-card">
            <CalendarDays />
            <h2>Расписание</h2>
            <p>Расписание ВО и СПО, заочные сессии и опубликованные замены.</p>
            <Link href="/schedule">Открыть расписание</Link>
          </div>
          <div className="info-card">
            <BookOpen />
            <h2>Учебные ресурсы</h2>
            <p>
              До завершения интеграции материалы доступны в действующих системах
              филиала.
            </p>
            <a href="https://vfrgups.ru/" target="_blank" rel="noreferrer">
              ЭИОС и библиотека на сайте филиала
            </a>
            <br />
            <a href="https://do.vfrgups.ru/" target="_blank" rel="noreferrer">
              Система онлайн-обучения
            </a>
          </div>
          <div className="info-card">
            <FileText />
            <h2>Документы</h2>
            <p>Официальные сведения, положения и учебная документация.</p>
            <Link href="/documents">Найти документы</Link>
          </div>
        </div>
        <div className="empty-inline" style={{ marginTop: 30 }}>
          <div>
            <h3>Преподаватели филиала</h3>
            <p>
              Найдите преподавателя по фамилии, дисциплине или образовательной
              программе.
            </p>
          </div>
          <Link className="text-link" href="/university/teachers">
            Открыть справочник
          </Link>
        </div>
        <div className="empty-inline" style={{ marginTop: 30 }}>
          <div>
            <h3>Будущий личный кабинет</h3>
            <p>
              Расписание, зачётная книжка, курсы и задания появятся на следующих
              этапах.
            </p>
          </div>
          <Link className="text-link" href="/login">
            Посмотреть форму входа
          </Link>
        </div>
      </section>
    </>
  );
}
