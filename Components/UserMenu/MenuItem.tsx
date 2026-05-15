import Link from "next/link";
import { MenuIcon, type MenuIconName } from "./MenuIcon";

interface MenuItemBase {
  icon: MenuIconName;
  label: string;
  onClick?: () => void;
  variant?: "default" | "danger";
}

interface MenuItemLink extends MenuItemBase {
  href: string;
}

interface MenuItemButton extends MenuItemBase {
  href?: never;
}

type MenuItemProps = MenuItemLink | MenuItemButton;

export function MenuItem({
  icon,
  label,
  onClick,
  variant = "default",
  href,
}: MenuItemProps) {
  const className =
    `menu-item ${variant === "danger" ? "menu-item--danger" : ""}`.trim();

  const content = (
    <>
      <MenuIcon name={icon} />
      <span className="menu-item__label">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick} role="menuitem">
        {content}
      </Link>
    );
  }

  return (
    <button className={className} onClick={onClick} role="menuitem">
      {content}
    </button>
  );
}
