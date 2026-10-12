import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  UserRound,
  MapPin,
  BriefcaseBusiness,
  TrainFront,
  Building2,
} from "lucide-react";
import { NewsCard, SectionHead } from "@/components/ui";
import { news } from "@/lib/data";
export default function Home() {
  return (
    <>
      <section className="hero">
        <Image
          className="hero-photo"
          src="/images/hero.jpg"
          alt="Железнодорожный вокзал Воронеж-1"
          fill
          priority
          sizes="100vw"
        />
        <div className="hero-shade" />
        <div className="hero-rail" aria-hidden="true" />
        <div className="container hero-content">
          <div className="hero-kicker">
            <span />
            ТВОЙ ГОРОД. ТВОЙ УНИВЕРСИТЕТ.
          </div>
          <h1>
            Твоё будущее
            <br />в <em>движении.</em>
          </h1>
          <p>
            Филиал РГУПС в городе Воронеж
            <br />
            От первого шага — к большим возможностям.
          </p>
          <div className="hero-actions">
            <Link href="/admissions" className="button button-red">
              Стать частью РГУПС
            </Link>
            <Link href="/university" className="hero-secondary">
              Познакомиться с университетом
            </Link>
          </div>
          <div className="hero-caption">
            <MapPin size={15} /> Воронеж, Россия <span>Вокзал Воронеж-1</span>
          </div>
        </div>
        <div className="hero-index">
          01 <span>/</span> РГУПС · ВОРОНЕЖ
        </div>
      </section>
      <div className="container quick-links">
        <Link href="/admissions">
          <GraduationCap />
          <span>
            <b>Поступить</b>
            <small>Твой следующий шаг</small>
          </span>
          <span className="quick-number">01</span>
        </Link>
        <Link href="/schedule">
          <CalendarDays />
          <span>
            <b>Расписание</b>
            <small>Планируй свой день</small>
          </span>
          <span className="quick-number">02</span>
        </Link>
        <Link href="/login">
          <UserRound />
          <span>
            <b>Личный кабинет</b>
            <small>Твоё учебное пространство</small>
          </span>
          <span className="quick-number">03</span>
        </Link>
        <Link href="/education/additional">
          <BookOpen />
          <span>
            <b>Дополнительное образование</b>
            <small>Продолжай развиваться</small>
          </span>
          <span className="quick-number">04</span>
        </Link>
      </div>
      <section className="section container">
        <SectionHead
          eyebrow="В ЦЕНТРЕ СОБЫТИЙ"
          title="Жизнь университета"
          href="/news"
          label="Все новости"
        />
        <div className="news-grid">
          {news.slice(0, 3).map((item) => (
            <NewsCard key={item.slug} item={item} />
          ))}
        </div>
      </section>
      <section className="university-strip">
        <div className="container university-strip-inner">
          <div className="strip-intro">
            <span className="eyebrow">ТРАДИЦИИ. ЗНАНИЯ. ВОЗМОЖНОСТИ.</span>
            <h2>
              Точка отправления
              <br />в большую профессию
            </h2>
          </div>
          <div className="stat">
            <strong>
              1878<span>год</span>
            </strong>
            <p>Начало истории филиала</p>
          </div>
          <div className="stat">
            <strong>
              3<span>уровня</span>
            </strong>
            <p>ВО · СПО · Дополнительное образование</p>
          </div>
          <div className="stat stat-icon">
            <TrainFront size={38} strokeWidth={1} />
            <p>
              В единой системе
              <br />
              железнодорожного образования
            </p>
          </div>
        </div>
      </section>
      <section className="section container">
        <SectionHead
          eyebrow="ВЫБЕРИ СВОЙ ПУТЬ"
          title="Образование с перспективой"
          href="/education"
          label="Все направления"
        />
        <div className="education-grid">
          <Link href="/education" className="education-tile">
            <span className="tile-number">01 / ВО</span>
            <GraduationCap size={42} strokeWidth={1.2} />
            <h3>
              Высшее
              <br />
              образование
            </h3>
            <p>
              Фундаментальные знания.
              <br />
              Инженерное мышление.
            </p>
            <span className="tile-foot">Программы специалитета</span>
          </Link>
          <Link href="/education#spo" className="education-tile">
            <span className="tile-number">02 / СПО</span>
            <Building2 size={42} strokeWidth={1.2} />
            <h3>
              Среднее
              <br />
              профессиональное
            </h3>
            <p>
              Практические навыки.
              <br />
              Уверенный старт в профессии.
            </p>
            <span className="tile-foot">Программы подготовки специалистов</span>
          </Link>
          <Link
            href="/education/additional"
            className="education-tile education-red"
          >
            <span className="tile-number">03 / ДПО</span>
            <BriefcaseBusiness size={42} strokeWidth={1.2} />
            <h3>
              Обучение
              <br />
              всю жизнь
            </h3>
            <p>
              Новая квалификация.
              <br />
              Следующая ступень карьеры.
            </p>
            <span className="tile-foot">Дополнительное образование</span>
          </Link>
        </div>
      </section>
      <section className="schedule-section">
        <div className="container schedule-home">
          <div>
            <span className="eyebrow">КАЖДЫЙ ДЕНЬ — ШАГ ВПЕРЁД</span>
            <h2>
              Всё важное.
              <br />В твоём ритме.
            </h2>
            <p>
              Расписание занятий всегда под рукой.
              <br />
              Расписание ВО и СПО, сессии и замены.
            </p>
            <Link className="button button-dark" href="/schedule">
              Открыть расписание
            </Link>
            <div className="schedule-mini-tags">
              <span>
                <CalendarDays size={16} /> По группе
              </span>
              <span>
                <UserRound size={16} /> Справочник преподавателей
              </span>
            </div>
          </div>
          <div className="schedule-preview">
            <div className="schedule-preview-head">
              <div>
                <span className="eyebrow">УЧЕБНЫЙ ГОД 2026 / 2027</span>
                <h3>Планируй свою учёбу</h3>
              </div>
              <span className="badge">ВО + СПО</span>
            </div>
            <div className="schedule-home-links">
              <Link href="/schedule">
                <CalendarDays size={25} />
                <span>
                  Расписание занятий
                  <small>Группы, курсы, сессии и изменения</small>
                </span>
              </Link>
              <Link href="/university/teachers">
                <UserRound size={25} />
                <span>
                  Преподаватели филиала
                  <small>Дисциплины, квалификация и программы</small>
                </span>
              </Link>
            </div>
            <div className="preview-footer">
              <CalendarDays size={14} />
              По официальным публикациям филиала
            </div>
          </div>
        </div>
      </section>
      <section className="section container split-section">
        <div className="applicant-card">
          <span className="eyebrow">АБИТУРИЕНТУ</span>
          <h2>
            Большой путь
            <br />
            начинается здесь.
          </h2>
          <p>
            Выбери направление, узнай о поступлении
            <br />и найди ответы на важные вопросы.
          </p>
          <Link className="button button-red" href="/admissions">
            Всё о поступлении
          </Link>
          <span className="applicant-mark" aria-hidden="true">
            V
          </span>
        </div>
        <div className="student-card">
          <span className="eyebrow">СТУДЕНТУ</span>
          <h2>
            Университет
            <br />
            рядом.
          </h2>
          <Link href="/schedule">Расписание занятий</Link>
          <Link href="/student">Учебные ресурсы</Link>
          <Link href="/login">Электронная образовательная среда</Link>
          <Link href="/documents">Документы и справки</Link>
        </div>
      </section>
      <section className="container events-section">
        <SectionHead
          eyebrow="УНИВЕРСИТЕТСКИЙ КАЛЕНДАРЬ"
          title="Ближайшие события"
        />
        <div className="empty-inline">
          <CalendarDays size={28} />
          <div>
            <h3>Новые встречи — впереди</h3>
            <p>
              Подтверждённые даты дней открытых дверей и мероприятий появятся
              после обновления календаря.
            </p>
          </div>
          <a
            className="text-link"
            href="https://vfrgups.ru/"
            target="_blank"
            rel="noreferrer"
          >
            Афиша филиала
          </a>
        </div>
      </section>
      <section className="container partner-section">
        <span className="eyebrow">ОБРАЗОВАНИЕ И ОТРАСЛЬ</span>
        <div className="partner-row">
          <a href="https://www.rgups.ru/" target="_blank" rel="noreferrer">
            РГУПС <span>Головной университет</span>
          </a>
          <a
            href="https://www.rzd.ru/"
            target="_blank"
            rel="noreferrer"
            className="rzd"
          >
            РЖД <span>Железнодорожная отрасль</span>
          </a>
          <div>
            ЮВЖД <span>Юго-Восточная железная дорога</span>
          </div>
        </div>
      </section>
      <section className="contact-banner">
        <div className="container">
          <div>
            <span className="eyebrow">МЕСТО ВСТРЕЧИ — ВОРОНЕЖ</span>
            <h2>Увидимся в университете</h2>
            <p>
              <MapPin size={18} /> ул. Урицкого, 75а
            </p>
          </div>
          <Link href="/contacts" className="button button-outline">
            Контакты и маршрут
          </Link>
        </div>
      </section>
    </>
  );
}
