import { PageHeading } from "@/components/ui";
import { NewsBrowser } from "@/components/news-browser";
export const metadata = { title: "Новости" };
export default function NewsPage() {
  return (
    <>
      <PageHeading eyebrow="Новости" title="Университет в движении">
        События, достижения и истории людей, которые создают будущее.
      </PageHeading>
      <section className="container page-content">
        <NewsBrowser />
      </section>
    </>
  );
}
