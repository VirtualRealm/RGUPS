import { PageHeading } from "@/components/ui";
import { ScheduleBrowser } from "@/components/schedule-browser";
import { SourceNote } from "@/components/source-note";
import { Timetable } from "@/components/timetable";
import { ScheduleDetails } from "@/components/schedule-details";
export const metadata = { title: "Расписание" };
export default function SchedulePage() {
  return (
    <>
      <PageHeading eyebrow="Расписание" title="Твой учебный ритм">
        Расписания высшего и среднего профессионального образования, заочные
        сессии и изменения в занятиях.
      </PageHeading>
      <section className="container page-content">
        <SourceNote>
          Документы и сервисы из{" "}
          <a
            href="https://vfrgups.ru/studentam/raspisanie"
            target="_blank"
            rel="noreferrer"
          >
            официального раздела расписания
          </a>
          . Перед посещением занятий проверьте последние изменения у филиала.
        </SourceNote>
        <nav className="section-nav" aria-label="Разделы расписания">
          <a href="#calendar">Календарь ВО</a>
          <a href="#sessions">Заочные сессии</a>
          <a href="#spo-changes">Замены СПО</a>
          <a href="#documents">PDF и сервисы</a>
        </nav>
        <Timetable />
        <ScheduleDetails />
        <div id="documents">
          <ScheduleBrowser />
        </div>
      </section>
    </>
  );
}
