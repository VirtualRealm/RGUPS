import { AccountDashboard } from "@/components/account-dashboard";
export const metadata = {
  title: "Дисциплины",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <AccountDashboard section="courses" />;
}
