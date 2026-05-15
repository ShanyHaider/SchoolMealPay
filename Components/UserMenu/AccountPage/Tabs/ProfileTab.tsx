"use client";

import { useUser } from "@clerk/nextjs";
import { UserAvatar } from "../../UserAvatar";
import { AccountRow } from "../AccountRow";

export function ProfileTab() {
  const { user, isLoaded } = useUser();

  return (
    <section className="account-tab">
      <h2 className="account-tab__title">Profile details</h2>

      <AccountRow label="Profile">
        <div className="profile-row">
          <UserAvatar user={user} size="lg" isLoaded={isLoaded} />
          <span className="profile-row__name">{user?.fullName ?? "—"}</span>
        </div>
        <button className="account-action" onClick={() => user?.update({})}>
          Update profile
        </button>
      </AccountRow>

      <AccountRow label="Email addresses">
        <div className="account-values">
          {user?.emailAddresses.map((addr) => (
            <span key={addr.id} className="account-value">
              {addr.emailAddress}
            </span>
          ))}
          <button className="account-action account-action--add">
            + Add email address
          </button>
        </div>
      </AccountRow>

      <AccountRow label="Phone number">
        <div className="account-values">
          {user?.phoneNumbers.map((ph) => (
            <span key={ph.id} className="account-value">
              {ph.phoneNumber}
            </span>
          ))}
          <button className="account-action account-action--add">
            + Add phone number
          </button>
        </div>
      </AccountRow>

      <AccountRow label="Connected accounts">
        <div className="account-values">
          {user?.externalAccounts.map((acct) => (
            <span
              key={acct.id}
              className="account-value account-value--connected"
            >
              <span className="account-value__provider">{acct.provider}</span>
              <span className="account-value__dot">·</span>
              <span className="account-value__email">{acct.emailAddress}</span>
            </span>
          ))}
          <button className="account-action account-action--add">
            + Connect account
          </button>
        </div>
      </AccountRow>
    </section>
  );
}
