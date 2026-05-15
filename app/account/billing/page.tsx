import { BillingTab } from "@/Components/UserMenu/AccountPage/Tabs/BillingTab";
import { AccountLayout } from "@/Components/UserMenu/AccountPage/AccountLayout";

export const metadata = { title: "Account – Billing" };

export default function BillingPage() {
  return (
    <AccountLayout activeTab="billing">
      <BillingTab />
    </AccountLayout>
  );
}
