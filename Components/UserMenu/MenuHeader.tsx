import type { ReactNode } from "react";

interface MenuHeaderProps {
  avatar: ReactNode;
  name: string;
  email: string;
}

export function MenuHeader({ avatar, name, email }: MenuHeaderProps) {
  return (
    <div className="menu-header">
      <div className="menu-header__avatar">{avatar}</div>
      <div className="menu-header__info">
        <span className="menu-header__name">{name}</span>
        <span className="menu-header__email">{email}</span>
      </div>
    </div>
  );
}
