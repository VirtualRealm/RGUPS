"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  X,
  UserRound,
  MapPin,
  Phone,
  Mail,
  TrainFront,
  ExternalLink,
} from "lucide-react";
const navigation = [
  { href: "/university", label: "Университет" },
  { href: "/admissions", label: "Абитуриенту" },
  { href: "/student", label: "Студенту" },
  { href: "/education", label: "Образование" },
  { href: "/news", label: "Новости" },
  { href: "/contacts", label: "Контакты" },
];
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="РГУПС Воронеж — на главную"
    >
      <svg aria-hidden="true" viewBox="0 0 54 58">
        <path
          d="M3 4 25 54h9L14 4Zm37 0L26 40l7 16L52 4Z"
          fill="currentColor"
        />
      </svg>
      <span>
        <b>РГУПС</b>
        <small>ВОРОНЕЖ</small>
      </span>
    </Link>
  );
}
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="utility">
        <div className="container utility-inner">
          <span>
            Филиал Ростовского государственного университета путей сообщения
          </span>
          <div>
            <a href="/documents/">Сведения об образовательной организации</a>
            <a href="https://www.rgups.ru/" target="_blank" rel="noreferrer">
              РГУПС <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Основная навигация">
            {navigation.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={pathname.startsWith(n.href) ? "active" : ""}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <Link className="account-link" href="/dashboard">
            <UserRound size={18} />
            <span>Личный кабинет</span>
          </Link>
          <button
            className="menu-toggle icon-button"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav
            id="mobile-navigation"
            className="mobile-nav"
            aria-label="Мобильная навигация"
          >
            {navigation.map((n) => (
              <Link onClick={() => setOpen(false)} key={n.href} href={n.href}>
                {n.label}
              </Link>
            ))}
            <Link onClick={() => setOpen(false)} href="/schedule">
              Расписание
            </Link>
            <Link onClick={() => setOpen(false)} href="/dashboard">
              Личный кабинет
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Brand light />
          <p>
            Образование, которое
            <br />
            приводит в движение.
          </p>
          <div className="footer-location">
            <MapPin size={16} /> Воронеж, ул. Урицкого, 75а
          </div>
        </div>
        <div>
          <h3>Университет</h3>
          <Link href="/university">О филиале</Link>
          <Link href="/university/teachers">Преподаватели</Link>
          <Link href="/university/leadership">Руководство</Link>
          <Link href="/university/structure">Структура и подразделения</Link>
          <Link href="/news">Новости и события</Link>
          <Link href="/documents">Документы</Link>
          <Link href="/contacts">Контакты</Link>
        </div>
        <div>
          <h3>Образование</h3>
          <Link href="/admissions">Поступление</Link>
          <Link href="/education">Направления подготовки</Link>
          <Link href="/education/additional">Дополнительное образование</Link>
          <Link href="/schedule">Расписание</Link>
        </div>
        <div>
          <h3>На связи</h3>
          <a href="tel:+74732211814">
            <Phone size={15} />
            +7 (473) 221-18-14
          </a>
          <a href="mailto:voronezh@rgups.ru">
            <Mail size={15} />
            voronezh@rgups.ru
          </a>
          <Link href="/contacts" className="footer-contact">
            Как добраться <MapPin size={15} />
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 РГУПС · Воронеж</span>
        <span>Концепция цифрового портала · Демо</span>
        <Link href="/credits">Источники и изображения</Link>
        <TrainFront size={18} />
      </div>
    </footer>
  );
}
