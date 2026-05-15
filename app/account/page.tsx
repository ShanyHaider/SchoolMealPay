import { ProfileTab } from "@/Components/UserMenu/AccountPage/Tabs/ProfileTab";
import { AccountLayout } from "@/Components/UserMenu/AccountPage/AccountLayout";

export const metadata = { title: "Account - Profile" };

export default function AccountPage() {
  return (
    <AccountLayout activeTab="profile">
      <ProfileTab />
    </AccountLayout>
  );
}
