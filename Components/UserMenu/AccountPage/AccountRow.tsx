import type { ReactNode } from "react";

interface AccountRowProps {
  label: string;
  children: ReactNode;
}

export function AccountRow({ label, children }: AccountRowProps) {
  return (
    <div className="account-row">
      <span className="account-row__label">{label}</span>
      <div className="account-row__content">{children}</div>
    </div>
  );
}
