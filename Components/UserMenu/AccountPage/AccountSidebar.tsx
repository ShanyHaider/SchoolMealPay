// "use client";

// import { MenuIcon, type MenuIconName } from "../MenuIcon";
// import { MenuFooter } from "../MenuFooter";

// type Tab = "profile" | "security" | "billing";

// interface SidebarItem {
//   id: Tab;
//   label: string;
//   icon: MenuIconName;
// }

// const NAV_ITEMS: SidebarItem[] = [
//   { id: "profile", label: "Profile", icon: "profile" },
//   { id: "security", label: "Security", icon: "security" },
//   { id: "billing", label: "Billing", icon: "billing" },
// ];

// interface AccountSidebarProps {
//   activeTab: Tab;
//   onTabChange: (tab: Tab) => void;
// }

// export function AccountSidebar({
//   activeTab,
//   onTabChange,
// }: AccountSidebarProps) {
//   return (
//     <aside className="account-sidebar">
//       <div className="account-sidebar__header">
//         <h1 className="account-sidebar__title">Account</h1>
//         <p className="account-sidebar__subtitle">Manage your account info.</p>
//       </div>

//       <nav className="account-sidebar__nav" aria-label="Account sections">
//         {NAV_ITEMS.map((item) => (
//           <button
//             key={item.id}
//             className={`account-sidebar__item ${activeTab === item.id ? "account-sidebar__item--active" : ""}`}
//             onClick={() => onTabChange(item.id)}
//             aria-current={activeTab === item.id ? "page" : undefined}
//           >
//             <MenuIcon name={item.icon} />
//             <span>{item.label}</span>
//           </button>
//         ))}
//       </nav>

//       <div className="account-sidebar__footer">
//         <MenuFooter />
//       </div>
//     </aside>
//   );
// }
