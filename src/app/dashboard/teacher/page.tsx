import { AccountDashboard } from "@/components/account-dashboard";
export const metadata = {
  title: "Кабинет преподавателя",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <AccountDashboard section="home" initialTeacher />;
}
