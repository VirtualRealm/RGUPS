import { AccountDashboard } from "@/components/account-dashboard";
export const metadata = {
  title: "Задания",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <AccountDashboard section="assignments" />;
}
