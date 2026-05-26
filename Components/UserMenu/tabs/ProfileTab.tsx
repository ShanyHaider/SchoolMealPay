"use client";

import React, { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { AnimatePresence } from "framer-motion";

import { AvatarNameForm } from "../profile/AvatarNameForm";
import { EmailSection } from "../profile/EmailSection";
import { PhoneSection } from "../profile/PhoneSection";
import { ConnectedAccounts } from "../profile/ConnectedAccounts";
import { ReverificationModal } from "../shared/ReverificationModal";
import { StatusBanner, type StatusMessage } from "../shared/StatusBanner";
import { mapClerkError } from "../shared/clerkErrors";

export function ProfileTab() {
  const { user } = useUser();
  const [status, setStatus] = useState<StatusMessage>(null);

  // Reverification queue: pending action + success message
  const [pendingAction, setPendingAction] = useState<{
    action: (payload?: any) => Promise<void>;
    successMsg: string;
  } | null>(null);

  if (!user) return null;

  const totalFactors =
    user.emailAddresses.length +
    user.phoneNumbers.length +
    user.externalAccounts.length;
  const isLastFactor = totalFactors <= 1;

  const showStatus = useCallback(
    (type: "success" | "error" | "warning", text: string) => {
      setStatus({ type, text });
      setTimeout(() => setStatus(null), 5000);
    },
    [],
  );

  // Called by child sections when they need reverification before proceeding
  const handleNeedsReverification = useCallback(
    (action: (payload?: any) => Promise<void>, successMsg: string) => {
      setPendingAction({ action, successMsg });
    },
    [],
  );

  // Called by ReverificationModal once the user submits credentials
  const handleVerified = async (payload: any) => {
    if (!pendingAction) return;
    try {
      // Pass the credential payload straight through to the waiting hook action wrapper
      await pendingAction.action(payload);
      showStatus("success", pendingAction.successMsg);
    } catch (err) {
      showStatus("error", mapClerkError(err));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-8 pr-1 select-none">
      {/* Reverification modal — rendered when a protected action is requested */}
      <AnimatePresence>
        {pendingAction && (
          <ReverificationModal
            onComplete={handleVerified}
            onCancel={() => {
              setPendingAction(null);
              showStatus("warning", "Action cancelled.");
            }}
          />
        )}
      </AnimatePresence>

      {/* Status banner */}
      <AnimatePresence>
        {status && <StatusBanner status={status} />}
      </AnimatePresence>

      <div>
        <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
          Profile details
        </h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
          Manage your identity, contact details, and connected accounts.
        </p>
      </div>

      <AvatarNameForm onStatus={showStatus} />

      <EmailSection
        isLastFactor={isLastFactor}
        onStatus={showStatus}
        onNeedsReverification={handleNeedsReverification}
      />

      <PhoneSection
        isLastFactor={isLastFactor}
        onStatus={showStatus}
        onNeedsReverification={handleNeedsReverification}
      />

      <ConnectedAccounts
        isLastFactor={isLastFactor}
        onStatus={showStatus}
        onNeedsReverification={handleNeedsReverification}
      />
    </div>
  );
}
