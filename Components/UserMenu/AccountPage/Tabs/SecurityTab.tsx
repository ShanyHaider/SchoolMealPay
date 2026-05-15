"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { AccountRow } from "../AccountRow";

export function SecurityTab() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();

  const passwordEnabled = user?.passwordEnabled;
  const twoFactorEnabled = user?.twoFactorEnabled;
  const sessions = user?.organizationMemberships ?? [];

  return (
    <section className="account-tab">
      <h2 className="account-tab__title">Security</h2>

      <AccountRow label="Password">
        <div className="account-values">
          <span className="account-value">
            {passwordEnabled ?
              "Password set"
            : "No password — using social login"}
          </span>
          <button
            className="account-action"
            onClick={() => openUserProfile({ appearance: {} })}
          >
            {passwordEnabled ? "Change password" : "Set password"}
          </button>
        </div>
      </AccountRow>

      <AccountRow label="Two-factor auth">
        <div className="account-values">
          <span
            className={`account-value security-badge ${twoFactorEnabled ? "security-badge--on" : "security-badge--off"}`}
          >
            {twoFactorEnabled ? "✓  Enabled" : "✗  Not enabled"}
          </span>
          <button
            className="account-action"
            onClick={() => openUserProfile({ appearance: {} })}
          >
            {twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
          </button>
        </div>
      </AccountRow>

      <AccountRow label="Active devices">
        <div className="account-values">
          <ActiveSessions />
        </div>
      </AccountRow>
    </section>
  );
}

function ActiveSessions() {
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!user) return null;

  // Clerk exposes sessions via user.getSessions() but in the component
  // we show a static entry for the current device plus a sign-out-all action
  return (
    <>
      <div className="session-row">
        <span className="session-row__device">This device</span>
        <span className="session-badge session-badge--active">Active now</span>
      </div>
      <button
        className="account-action account-action--danger"
        onClick={() => signOut({ redirectUrl: "/" })}
      >
        Sign out of all devices
      </button>
    </>
  );
}
