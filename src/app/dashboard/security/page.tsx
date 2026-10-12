import { AccountDashboard } from "@/components/account-dashboard";
export const metadata = {
  title: "Устройства и пароль",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <AccountDashboard section="security" />;
}
