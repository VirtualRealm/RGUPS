import { AccountDashboard } from "@/components/account-dashboard";
export const metadata = {
  title: "Мои группы",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <AccountDashboard section="groups" />;
}
