// components/staff/StaffClient.tsx
"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2, ArrowUpCircle, X } from "lucide-react";

import {
  inviteStaffSchema,
  type InviteStaffInput,
} from "@/lib/validations/canteen";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ToastContainer, useToast } from "@/components/useToast";
import { PendingInvitationsCard } from "./PendingInvitationsCard";
import { StaffTable, type StaffMember } from "./StaffTable";
import { CanteenSelector } from "./CanteenSelector";
import { useStaffActions } from "@/hooks/useStaffActions";
import { inviteStaffMember, promoteToStaff } from "@/db/actions/admin/Staff";

type Canteen = { id: string; name: string };
type PendingInvitation = {
  id: string;
  name: string;
  email: string;
  status: "pending" | "accepted" | "expired";
  canteen?: { id: string; name: string } | null;
};
type PromotableUser = { id: string; email: string; currentRole: string };

const inputStyle: React.CSSProperties = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-input)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 14,
  padding: "9px 12px",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="block text-xs font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

type Tab = "active" | "pending";

function TabBar({
  active,
  onChange,
  pendingCount,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  pendingCount: number;
}) {
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "active", label: "Active / Inactive" },
    { id: "pending", label: "Pending Invitations", count: pendingCount },
  ];

  return (
    <div
      className="flex gap-1 p-1 rounded-xl w-full sm:w-fit"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-input)",
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all"
          style={
            active === t.id ?
              {
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                boxShadow: "var(--shadow-btn)",
              }
            : { color: "var(--text-muted)" }
          }
        >
          {t.label}
          {t.count != null && t.count > 0 && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(251,191,36,0.15)", color: "#f59e0b" }}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function StaffClient({
  staff,
  canteens,
  adminId,
  pendingInvitations = [],
}: {
  staff: StaffMember[];
  canteens: Canteen[];
  adminId: string;
  pendingInvitations?: PendingInvitation[];
}) {
  const { toasts, toast, dismiss } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("active");

  const {
    assignPendingId,
    handleAssign,
    removingStaff,
    setRemovingStaff,
    isRemovePending,
    confirmRemove,
    togglingStaff,
    setTogglingStaff,
    isTogglePending,
    confirmToggleDisable,
    deletingStaff,
    setDeletingStaff,
    isDeletePending,
    confirmDelete,
    anyActionPending,
  } = useStaffActions(adminId);

  const [showInvite, setShowInvite] = useState(false);
  const [isInvitePending, startInviteTransition] = useTransition();
  const [promotable, setPromotable] = useState<PromotableUser | null>(null);
  const [isPromotePending, startPromoteTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset: resetInviteForm,
    control,
    watch,
    formState: { errors },
  } = useForm<InviteStaffInput>({ resolver: zodResolver(inviteStaffSchema) });

  const closeInviteModal = () => {
    resetInviteForm();
    setPromotable(null);
    setShowInvite(false);
  };

  const onInvite = (data: InviteStaffInput) => {
    setPromotable(null);
    startInviteTransition(async () => {
      try {
        const result = await inviteStaffMember(data, adminId);
        if (result?.error) {
          const err = result.error as Record<string, string[]>;
          const existingId = err.existingUserId?.[0];
          const existingRole = err.existingRole?.[0];
          if (existingId)
            setPromotable({
              id: existingId,
              email: data.email,
              currentRole: existingRole ?? "parent",
            });
          const first = err.email?.[0] ?? Object.values(err).flat()[0];
          toast(
            typeof first === "string" ? first : "Failed to send invitation.",
            "error",
          );
          return;
        }
        toast(`Invitation sent to ${data.email}.`, "success");
        closeInviteModal();
      } catch {
        toast("Failed to send invitation.", "error");
      }
    });
  };

  const handlePromote = () => {
    if (!promotable) return;
    startPromoteTransition(async () => {
      try {
        await promoteToStaff(promotable.id);
        toast(`${promotable.email} promoted to canteen staff.`, "success");
        closeInviteModal();
      } catch {
        toast("Failed to promote user.", "error");
      }
    });
  };

  const isCurrentlyDisabled = togglingStaff?.status === "disabled";
  const isFormBusy = isInvitePending || isPromotePending;

  const nameValue = watch("name");
  const emailValue = watch("email");
  const isSubmitDisabled =
    isFormBusy || !nameValue?.trim() || !emailValue?.trim();

  return (
    <>
      <div className="space-y-4 sm:space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <TabBar
            active={activeTab}
            onChange={setActiveTab}
            pendingCount={pendingInvitations.length}
          />
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium sm:ml-auto"
            style={{
              background: "var(--accent)",
              color: "var(--accent-text)",
              boxShadow: "var(--shadow-btn)",
            }}
          >
            <Plus size={15} /> Invite Staff
          </button>
        </div>

        {activeTab === "active" && (
          <StaffTable
            staff={staff}
            canteens={canteens}
            assignPendingId={assignPendingId}
            actionsPending={anyActionPending}
            onAssign={handleAssign}
            onRemoveAssignment={setRemovingStaff}
            onToggleDisable={setTogglingStaff}
            onDelete={setDeletingStaff}
          />
        )}
        {activeTab === "pending" && (
          <PendingInvitationsCard invitations={pendingInvitations} />
        )}
      </div>

      {/* Invite modal — bottom sheet on mobile, centered on sm+ */}
      {showInvite &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => !isFormBusy && closeInviteModal()}
            />
            <div
              className="relative w-full max-w-md rounded-2xl p-6 z-10 space-y-4 border max-h-[92dvh] overflow-y-auto"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              {/* Drag handle — mobile only */}

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Invite Canteen Staff
                  </h2>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    They'll receive an email to set up their account.
                  </p>
                </div>
                <button
                  onClick={closeInviteModal}
                  disabled={isFormBusy}
                  className="p-1.5 rounded-lg hover:bg-(--bg-tertiary) transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  <X size={15} style={{ color: "var(--text-muted)" }} />
                </button>
              </div>

              {promotable && (
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{
                    background: "rgba(251,191,36,0.07)",
                    border: "1px solid rgba(251,191,36,0.2)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <ArrowUpCircle
                      size={15}
                      style={{ color: "#f59e0b", marginTop: 1, flexShrink: 0 }}
                    />
                    <div>
                      <p
                        className="text-xs font-medium"
                        style={{ color: "#f59e0b" }}
                      >
                        Account already exists
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span
                          className="font-medium"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {promotable.email}
                        </span>{" "}
                        is already registered as a{" "}
                        <span className="font-medium">
                          {promotable.currentRole}
                        </span>
                        . You can promote them to canteen staff instead.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePromote}
                    disabled={isPromotePending}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
                    style={{
                      background: "rgba(251,191,36,0.15)",
                      color: "#f59e0b",
                      border: "1px solid rgba(251,191,36,0.25)",
                    }}
                  >
                    {isPromotePending ?
                      <Loader2 size={12} className="animate-spin" />
                    : <ArrowUpCircle size={12} />}
                    {isPromotePending ?
                      "Promoting…"
                    : "Promote to Canteen Staff"}
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit(onInvite)} className="space-y-3">
                <Field label="Full Name" required error={errors.name?.message}>
                  <input
                    {...register("name")}
                    placeholder="Sarah Ahmed"
                    style={inputStyle}
                    disabled={isFormBusy}
                    autoFocus
                  />
                </Field>
                <Field
                  label="Email Address"
                  required
                  error={errors.email?.message}
                >
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="sarah@school.edu"
                    style={inputStyle}
                    disabled={isFormBusy}
                  />
                </Field>
                <Field label="Phone (optional)" error={errors.phone?.message}>
                  <input
                    {...register("phone")}
                    placeholder="+92 300 0000000"
                    style={inputStyle}
                    disabled={isFormBusy}
                  />
                </Field>

                {/* Canteen selector — matches ClassSelector design */}
                <Controller
                  name="canteenId"
                  control={control}
                  render={({ field }) => (
                    <CanteenSelector
                      canteens={canteens}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.canteenId?.message}
                      label="Assign to Canteen"
                      optional
                      disabled={isFormBusy}
                    />
                  )}
                />

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={closeInviteModal}
                    disabled={isFormBusy}
                    className="flex-1 py-2.5 sm:py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
                    style={{
                      borderColor: "var(--border-input)",
                      background: "var(--bg-tertiary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="flex-1 py-2.5 sm:py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{
                      background: "var(--accent)",
                      color: "var(--accent-text)",
                    }}
                  >
                    {isInvitePending && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    {isInvitePending ? "Sending…" : "Send Invitation"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {removingStaff &&
        createPortal(
          <ConfirmModal
            title="Remove canteen assignment"
            description={`Remove ${removingStaff.name} from ${removingStaff.canteenStaffAssignment?.canteen.name ?? "their canteen"}? They will remain a staff member and can be reassigned.`}
            confirmLabel="Remove"
            variant="warning"
            isPending={isRemovePending}
            onClose={() => setRemovingStaff(null)}
            onConfirm={confirmRemove}
          />,
          document.body,
        )}

      {togglingStaff &&
        createPortal(
          <ConfirmModal
            title={
              isCurrentlyDisabled ?
                "Enable staff member"
              : "Disable staff member"
            }
            description={
              isCurrentlyDisabled ?
                `Re-enable ${togglingStaff.name}? They will be able to log in again.`
              : `Disable ${togglingStaff.name}? Their account will be banned and they won't be able to log in.`
            }
            confirmLabel={isCurrentlyDisabled ? "Enable" : "Disable"}
            variant={isCurrentlyDisabled ? "success" : "warning"}
            isPending={isTogglePending}
            onClose={() => setTogglingStaff(null)}
            onConfirm={confirmToggleDisable}
          />,
          document.body,
        )}

      {deletingStaff &&
        createPortal(
          <ConfirmModal
            title="Delete staff member"
            description={`Permanently delete ${deletingStaff.name}? This removes their staff role, unassigns them from any canteen, and revokes access. This cannot be undone.`}
            confirmLabel="Delete"
            variant="danger"
            isPending={isDeletePending}
            onClose={() => setDeletingStaff(null)}
            onConfirm={confirmDelete}
          />,
          document.body,
        )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}
