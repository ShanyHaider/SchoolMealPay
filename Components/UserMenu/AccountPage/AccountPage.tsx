// "use client";

// import { useState } from "react";
// import { ProfileTab } from "./Tabs/ProfileTab";
// import { SecurityTab } from "./Tabs/SecurityTab";
// import { BillingTab } from "./Tabs/BillingTab";
// import { AccountSidebar } from "./AccountSidebar";

// type Tab = "profile" | "security" | "billing";

// export default function AccountPage() {
//   const [activeTab, setActiveTab] = useState<Tab>("profile");

//   const tabContent: Record<Tab, React.ReactNode> = {
//     profile: <ProfileTab />,
//     security: <SecurityTab />,
//     billing: <BillingTab />,
//   };

//   return (
//     <div className="account-page">
//       <AccountSidebar activeTab={activeTab} onTabChange={setActiveTab} />
//       <main className="account-page__content">{tabContent[activeTab]}</main>
//     </div>
//   );
// }
