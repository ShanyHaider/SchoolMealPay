// hooks/useStaffActions.ts
"use client";

import { useState, useTransition } from "react";
import {
    disableStaffMember,
    enableStaffMember,
    deleteStaffMember
} from "@/db/actions/admin/Staff";
import { useToast } from "@/components/useToast";
import { StaffMember } from "@/app/(dashboard)/school-admin/staff/_components/StaffTable";
import { assignStaffToCanteen, removeStaffAssignment } from "@/db/actions/admin/Staff";

export function useStaffActions(adminId: string) {
    const { toast } = useToast();

    // ── Assign ─────────────────────────────────────────────────────────────────
    const [assignPendingId, setAssignPendingId] = useState<string | null>(null);

    const handleAssign = async (staffId: string, canteenId: string) => {
        setAssignPendingId(staffId);
        try {
            await assignStaffToCanteen(staffId, canteenId, adminId);
            toast("Staff assigned to canteen.", "success");
        } catch {
            toast("Failed to assign staff.", "error");
        } finally {
            setAssignPendingId(null);
        }
    };

    // ── Remove assignment ──────────────────────────────────────────────────────
    const [removingStaff, setRemovingStaff] = useState<StaffMember | null>(null);
    const [isRemovePending, startRemoveTransition] = useTransition();

    const confirmRemove = () => {
        if (!removingStaff?.canteenStaffAssignment) return;
        startRemoveTransition(async () => {
            try {
                await removeStaffAssignment(
                    removingStaff.id,
                    removingStaff.canteenStaffAssignment!.canteen.id,
                );
                toast(
                    `${removingStaff.name} unassigned from ${removingStaff.canteenStaffAssignment!.canteen.name}.`,
                    "success",
                );
                setRemovingStaff(null);
            } catch {
                toast("Failed to remove assignment.", "error");
                setRemovingStaff(null);
            }
        });
    };

    // ── Disable / Enable ───────────────────────────────────────────────────────
    const [togglingStaff, setTogglingStaff] = useState<StaffMember | null>(null);
    const [isTogglePending, startToggleTransition] = useTransition();

    const confirmToggleDisable = () => {
        if (!togglingStaff) return;
        // Read the current status at confirm-time (not stale closure value)
        const isCurrentlyDisabled = togglingStaff.status === "disabled";

        startToggleTransition(async () => {
            try {
                if (isCurrentlyDisabled) {
                    await enableStaffMember(togglingStaff.id);
                    toast(`${togglingStaff.name} has been re-enabled.`, "success");
                } else {
                    await disableStaffMember(togglingStaff.id);
                    toast(
                        `${togglingStaff.name} has been disabled and can no longer log in.`,
                        "success",
                    );
                }
                setTogglingStaff(null);
            } catch {
                toast(
                    `Failed to ${isCurrentlyDisabled ? "enable" : "disable"} staff member.`,
                    "error",
                );
                setTogglingStaff(null);
            }
        });
    };

    // ── Delete ─────────────────────────────────────────────────────────────────
    const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
    const [isDeletePending, startDeleteTransition] = useTransition();

    const confirmDelete = () => {
        if (!deletingStaff) return;
        startDeleteTransition(async () => {
            try {
                await deleteStaffMember(deletingStaff.id);
                toast(`${deletingStaff.name} has been removed.`, "success");
                setDeletingStaff(null);
            } catch {
                toast("Failed to delete staff member.", "error");
                setDeletingStaff(null);
            }
        });
    };

    return {
        // Assign
        assignPendingId,
        handleAssign,
        // Remove assignment
        removingStaff,
        setRemovingStaff,
        isRemovePending,
        confirmRemove,
        // Toggle disable/enable
        togglingStaff,
        setTogglingStaff,
        isTogglePending,
        confirmToggleDisable,
        // Delete
        deletingStaff,
        setDeletingStaff,
        isDeletePending,
        confirmDelete,
        // Combined flag for disabling action buttons while any mutation is in-flight
        anyActionPending: isRemovePending || isTogglePending || isDeletePending,
    };
}