import { PageHeading } from "@/components/ui";
import { UniversityNav } from "@/components/university-nav";
import { SourceNote } from "@/components/source-note";
import { TeacherDirectory } from "@/components/teacher-directory";
import { teacherSummaries } from "@/lib/teachers";
import data from "@/content/teachers.json";
export const metadata = { title: "Все преподаватели ВО и СПО" };
export default function Page() {
  return (
    <>
      <PageHeading
        eyebrow="Университет / Преподаватели"
        title="Люди, которые передают знания"
      >
        Полный опубликованный педагогический состав филиала. Найдите
        преподавателя, его дисциплины и сведения о квалификации.
      </PageHeading>
      <section className="container page-content">
        <UniversityNav />
        <SourceNote>
          Объединены {data.sourceRowCount} записей из официальных реестров:{" "}
          <a
            href="https://vfrgups.ru/studentam/pps"
            target="_blank"
            rel="noreferrer"
          >
            состав преподавателей
          </a>{" "}
          и{" "}
          <a
            href="https://bypass.rgups.ru/filiali/voronezh/"
            target="_blank"
            rel="noreferrer"
          >
            сведения о филиале
          </a>
          . Повторные записи по разным программам собраны в один профиль.
        </SourceNote>
        <div className="directory-stats">
          <div>
            <strong>{data.teachers.length}</strong>
            <span>преподавателя в справочнике</span>
          </div>
          <div>
            <strong>
              {data.teachers.filter((t) => t.levels.includes("ВО")).length}
            </strong>
            <span>высшее образование</span>
          </div>
          <div>
            <strong>
              {data.teachers.filter((t) => t.levels.includes("СПО")).length}
            </strong>
            <span>среднее профессиональное</span>
          </div>
        </div>
        <TeacherDirectory teachers={teacherSummaries()} />
        <details className="content-block">
          <summary>Полнота и источники справочника</summary>
          <p>
            Проверены все {data.sources.length} реестров, на которые ссылаются
            две официальные страницы. В{" "}
            {data.sources.filter((s) => s.rowCount === 0).length} реестрах
            старых программ записи о преподавателях отсутствуют. Связь
            преподавателя с программой не означает, что на неё открыт текущий
            приём.
          </p>
          <div className="table-scroll">
            <table className="content-table">
              <thead>
                <tr>
                  <th>Образовательная программа</th>
                  <th>Записей в источнике</th>
                </tr>
              </thead>
              <tbody>
                {data.sources.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.title} ↗
                      </a>
                    </td>
                    <td>{s.rowCount || "Нет опубликованных записей"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </>
  );
}
