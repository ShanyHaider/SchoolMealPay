"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCanteen,
  updateCanteen,
  deleteCanteen,
} from "@/db/actions/admin/Canteen";
import { createCanteenSchema } from "@/lib/validations/canteen";
import type {
  CreateCanteenInput,
  UpdateCanteenInput,
} from "@/lib/validations/canteen";
import { useToast, ToastContainer } from "@/components/useToast";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  Plus,
  MapPin,
  Clock,
  Users2,
  UtensilsCrossed,
  Pencil,
  Trash2,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import z from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────
type CanteenFormValues = z.input<typeof createCanteenSchema>;

interface Canteen {
  id: string;
  name: string;
  location?: string | null;
  operatingFrom?: string | null;
  operatingUntil?: string | null;
  capacity?: number | null;
  isActive: boolean;
  staffAssignments?: { staffId: string; staff?: { name: string } }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtHours(from?: string | null, until?: string | null) {
  if (!from || !until) return null;
  return `${from} – ${until}`;
}

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2 ?
      `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0][0].toUpperCase();
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        className="text-xs font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </label>
      {children}
      {error && <span style={{ color: "#ef4444", fontSize: 11 }}>{error}</span>}
    </div>
  );
}

// ─── CanteenFormModal ─────────────────────────────────────────────────────────

interface CanteenFormModalProps {
  mode: "create" | "edit";
  canteen?: Canteen;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

function CanteenFormModal({
  mode,
  canteen,
  onClose,
  onSuccess,
}: CanteenFormModalProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CanteenFormValues>({
    resolver: zodResolver(createCanteenSchema),
    defaultValues:
      mode === "edit" && canteen ?
        {
          name: canteen.name,
          location: canteen.location ?? null,
          operatingFrom: canteen.operatingFrom ?? null,
          operatingUntil: canteen.operatingUntil ?? null,
          capacity: canteen.capacity ?? null,
        }
      : {
          name: "",
          location: null,
          operatingFrom: null,
          operatingUntil: null,
          capacity: null,
        },
  });

  const nameValue = watch("name");
  const isSubmitDisabled = isPending || !nameValue?.trim();

  const onSubmit = (data: CanteenFormValues) => {
    startTransition(async () => {
      if (mode === "create") {
        await createCanteen(data as CreateCanteenInput);
      } else if (canteen) {
        await updateCanteen(canteen.id, data as UpdateCanteenInput);
      }
      onSuccess(mode === "create" ? "Canteen created" : "Canteen updated");
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 z-10 max-h-[90vh] overflow-y-auto"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {mode === "create" ? "New Canteen" : "Edit Canteen"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-(--bg-tertiary) transition-colors"
          >
            <X size={15} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Name *" error={errors.name?.message}>
            <input
              {...register("name")}
              placeholder="e.g. Main Canteen"
              style={inputStyle}
            />
          </Field>

          <Field label="Location" error={errors.location?.message}>
            <input
              {...register("location")}
              placeholder="e.g. Block A, Ground Floor"
              style={inputStyle}
            />
          </Field>

          {/* Operating hours — stacks on mobile, side by side on sm+ */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Operating Hours
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Opens
                </label>
                <input
                  type="time"
                  {...register("operatingFrom")}
                  style={inputStyle}
                />
                {errors.operatingFrom && (
                  <span style={{ color: "#ef4444", fontSize: 11 }}>
                    {errors.operatingFrom.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Closes
                </label>
                <input
                  type="time"
                  {...register("operatingUntil")}
                  style={inputStyle}
                />
                {errors.operatingUntil && (
                  <span style={{ color: "#ef4444", fontSize: 11 }}>
                    {errors.operatingUntil.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Field label="Capacity" error={errors.capacity?.message}>
            <input
              type="number"
              min={1}
              {...register("capacity", { valueAsNumber: true })}
              placeholder="e.g. 200"
              style={inputStyle}
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-input)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{
                background: "var(--accent)",
                color: "var(--accent-text)",
              }}
            >
              {isPending ?
                mode === "create" ?
                  "Creating…"
                : "Saving…"
              : mode === "create" ?
                "Create"
              : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── CanteenCard ──────────────────────────────────────────────────────────────

interface CanteenCardProps {
  canteen: Canteen;
  isPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

function CanteenCard({
  canteen,
  isPending,
  onEdit,
  onDelete,
  onToggleActive,
}: CanteenCardProps) {
  const hours = fmtHours(canteen.operatingFrom, canteen.operatingUntil);
  const staffCount = canteen.staffAssignments?.length ?? 0;

  return (
    <div
      className="rounded-xl flex flex-col"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-card)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div className="min-w-0 flex-1">
          {/* Name + status badge */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3
              className="font-semibold text-base truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {canteen.name}
            </h3>
            <span
              className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
              style={
                canteen.isActive ?
                  { background: "rgba(34,197,94,0.1)", color: "#16a34a" }
                : {
                    background: "var(--bg-tertiary)",
                    color: "var(--text-muted)",
                  }
              }
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background:
                    canteen.isActive ? "#16a34a" : "var(--text-muted)",
                }}
              />
              {canteen.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Location */}
          {canteen.location && (
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{canteen.location}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={onEdit}
            title="Edit"
            className="p-1.5 rounded-lg transition-colors hover:bg-(--bg-secondary)"
          >
            <Pencil size={14} style={{ color: "var(--text-muted)" }} />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="p-1.5 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 size={14} style={{ color: "var(--text-muted)" }} />
          </button>
          <button
            onClick={onToggleActive}
            disabled={isPending}
            title={canteen.isActive ? "Deactivate" : "Activate"}
            className="ml-1 disabled:opacity-50"
          >
            {canteen.isActive ?
              <ToggleRight size={24} style={{ color: "#16a34a" }} />
            : <ToggleLeft size={24} style={{ color: "var(--text-muted)" }} />}
          </button>
        </div>
      </div>

      {/* ── Meta row ── */}
      {(hours || canteen.capacity) && (
        <div
          className="grid grid-cols-2 gap-px mx-5 mb-4 rounded-lg overflow-hidden text-xs"
          style={{ background: "var(--border-card)" }}
        >
          {hours && (
            <div
              className="flex items-center gap-2 px-3 py-2.5"
              style={{ background: "var(--bg-secondary)" }}
            >
              <Clock size={13} style={{ color: "var(--text-muted)" }} />
              <div>
                <p
                  className="text-[10px] uppercase font-semibold tracking-wide mb-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  Hours
                </p>
                <p
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {hours}
                </p>
              </div>
            </div>
          )}
          {canteen.capacity && (
            <div
              className="flex items-center gap-2 px-3 py-2.5"
              style={{ background: "var(--bg-secondary)" }}
            >
              <Users2 size={13} style={{ color: "var(--text-muted)" }} />
              <div>
                <p
                  className="text-[10px] uppercase font-semibold tracking-wide mb-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  Capacity
                </p>
                <p
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {canteen.capacity} seats
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Staff section ── */}
      <div
        className="px-5 pt-3.5 pb-4 mt-auto"
        style={{ borderTop: "1px solid var(--border-card)" }}
      >
        <p
          className="text-[10px] uppercase font-semibold tracking-wide mb-2.5"
          style={{ color: "var(--text-muted)" }}
        >
          Staff assigned ({staffCount})
        </p>

        {staffCount > 0 ?
          <div className="flex flex-wrap gap-1.5">
            {canteen.staffAssignments!.map((a) => (
              <div
                key={a.staffId}
                className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-xs"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-card)",
                  color: "var(--text-secondary)",
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-text)",
                  }}
                >
                  {getInitials(a.staff?.name)}
                </div>
                <span className="truncate max-w-[100px]">{a.staff?.name}</span>
              </div>
            ))}
          </div>
        : <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
            No staff assigned yet. Go to the Staff page to assign.
          </p>
        }
      </div>
    </div>
  );
}

// ─── CanteenClient ────────────────────────────────────────────────────────────

export function CanteenClient({ canteens }: { canteens: Canteen[] }) {
  const [isPending, startTransition] = useTransition();
  const { toasts, toast, dismiss } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [editCanteen, setEditCanteen] = useState<Canteen | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Canteen | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleActive = (canteen: Canteen) => {
    startTransition(async () => {
      await updateCanteen(canteen.id, { isActive: !canteen.isActive });
      toast(canteen.isActive ? "Canteen deactivated" : "Canteen activated");
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    startTransition(async () => {
      await deleteCanteen(deleteTarget.id);
      setDeleteTarget(null);
      setIsDeleting(false);
      toast("Canteen deleted", "error");
    });
  };

  return (
    <>
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      {showCreate && (
        <CanteenFormModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSuccess={(msg) => toast(msg)}
        />
      )}

      {editCanteen && (
        <CanteenFormModal
          mode="edit"
          canteen={editCanteen}
          onClose={() => setEditCanteen(null)}
          onSuccess={(msg) => toast(msg)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title={`Delete "${deleteTarget.name}"?`}
          description="This will permanently remove the canteen and unassign all staff. Orders and menu items linked to it will also be affected."
          isPending={isDeleting}
          confirmLabel="Delete"
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          variant="danger"
        />
      )}

      {/* Toolbar */}
      <div className="flex justify-end mb-5">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium w-full sm:w-auto"
          style={{
            background: "var(--accent)",
            color: "var(--accent-text)",
            boxShadow: "var(--shadow-btn)",
          }}
        >
          <Plus size={15} /> Add Canteen
        </button>
      </div>

      {/* Empty state */}
      {canteens.length === 0 ?
        <div
          className="rounded-xl border py-16 text-center px-4"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-card)",
          }}
        >
          <UtensilsCrossed
            size={32}
            className="mx-auto mb-3"
            style={{ color: "var(--text-muted)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No canteens yet. Add your first canteen.
          </p>
        </div>
      : <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {canteens.map((canteen) => (
            <CanteenCard
              key={canteen.id}
              canteen={canteen}
              isPending={isPending}
              onEdit={() => setEditCanteen(canteen)}
              onDelete={() => setDeleteTarget(canteen)}
              onToggleActive={() => handleToggleActive(canteen)}
            />
          ))}
        </div>
      }
    </>
  );
}
