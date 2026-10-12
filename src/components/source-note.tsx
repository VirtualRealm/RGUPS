export function SourceNote({
  children,
  date = "11 октября 2026",
}: {
  children: React.ReactNode;
  date?: string;
}) {
  return (
    <aside className="source-note">
      <span className="source-dot" aria-hidden="true" />
      <div>
        <strong>По официальным публикациям · {date}</strong>
        <div>{children}</div>
      </div>
    </aside>
  );
}
