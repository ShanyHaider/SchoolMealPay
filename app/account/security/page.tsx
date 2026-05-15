import { AccountLayout } from "@/Components/UserMenu/AccountPage/AccountLayout";
import { SecurityTab } from "@/Components/UserMenu/AccountPage/Tabs/SecurityTab";

export const metadata = { title: "Account – Security" };

export default function SecurityPage() {
  return (
    <AccountLayout activeTab="security">
      <SecurityTab />
    </AccountLayout>
  );
}
