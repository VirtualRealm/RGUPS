import { GraduationCap, ShieldCheck } from "lucide-react";
import { AuthForm } from "./auth-form";
export function AuthLayout({
  register = false,
  reset = false,
}: {
  register?: boolean;
  reset?: boolean;
}) {
  return (
    <section className="auth-layout">
      <div className="auth-intro">
        <span className="eyebrow">РГУПС · ВОРОНЕЖ</span>
        <GraduationCap size={48} strokeWidth={1} />
        <h1>
          Университет.
          <br />В твоём
          <br />
          пространстве.
        </h1>
        <p>
          Занятия, материалы и учебные результаты — в единой цифровой среде.
        </p>
        <div className="auth-feature">
          <ShieldCheck size={25} />
          Доступ после подтверждения
          <br />
          принадлежности к университету
        </div>
        <div className="auth-lines" aria-hidden="true" />
      </div>
      <AuthForm register={register} reset={reset} />
    </section>
  );
}
