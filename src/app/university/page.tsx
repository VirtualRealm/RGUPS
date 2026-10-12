import Link from "next/link";
import { TrainFront, GraduationCap, MapPin } from "lucide-react";
import { PageHeading } from "@/components/ui";
import { UniversityNav } from "@/components/university-nav";
export const metadata = { title: "О филиале" };
export default function Page() {
  return (
    <>
      <PageHeading eyebrow="Университет" title="Воронеж. РГУПС. Твоё будущее.">
        Филиал Ростовского государственного университета путей сообщения в
        городе Воронеж.
      </PageHeading>
      <section className="container page-content">
        <UniversityNav />
        <div className="info-grid">
          <div className="info-card">
            <TrainFront />
            <h2>С 1878 года</h2>
            <p>
              История филиала началась 21 сентября 1878 года. Преемственность
              железнодорожного образования соединяет поколения специалистов.
            </p>
            <a
              href="https://vfrgups.ru/onas/istoriya-filiala"
              target="_blank"
              rel="noreferrer"
            >
              История филиала
            </a>
          </div>
          <div className="info-card">
            <GraduationCap />
            <h2>Единая система</h2>
            <p>
              Высшее, среднее профессиональное и дополнительное образование в
              структуре РГУПС.
            </p>
            <Link href="/education">Направления образования</Link>
          </div>
          <div className="info-card">
            <MapPin />
            <h2>В центре Воронежа</h2>
            <p>
              Воронеж, ул. Урицкого, 75а. Знакомьтесь с филиалом и находите свой
              путь в профессии.
            </p>
            <Link href="/contacts">Как добраться</Link>
          </div>
        </div>
        <div className="prose">
          <h2>Традиции, которые продолжаются</h2>
          <p>
            Филиал готовит специалистов для транспортной отрасли. Новый цифровой
            портал объединяет информацию о поступлении, учебные ресурсы и жизнь
            университета.
          </p>
          <p>
            Познакомьтесь с{" "}
            <Link href="/university/teachers">преподавателями</Link>,{" "}
            <Link href="/university/leadership">
              руководством филиала и ректоратом
            </Link>
            . В <Link href="/university/structure">структуре университета</Link>{" "}
            собраны все опубликованные подразделения, их руководители, адреса и
            положения.
          </p>
        </div>
      </section>
    </>
  );
}
