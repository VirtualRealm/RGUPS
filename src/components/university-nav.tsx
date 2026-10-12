"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const links = [
  ["/university", "О филиале"],
  ["/university/teachers", "Преподаватели"],
  ["/university/leadership", "Руководство"],
  ["/university/structure", "Структура и органы управления"],
];
export function UniversityNav() {
  const pathname = usePathname().replace(/\/$/, "");
  return (
    <nav className="section-nav" aria-label="Разделы университета">
      {links.map(([href, label]) => (
        <Link
          href={href}
          key={href}
          aria-current={pathname === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
