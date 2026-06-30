"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ToastContainer, useToast } from "@/components/useToast";
import { StudentIdentityCard } from "./StudentIdentityCard";
import { SpendingSummarySection } from "./SpendingSummarySection";
import { SpendingLimitsForm } from "./SpendingLimitsForm";
import { AllergenSelector } from "./AllergenSelector";
import { BlockedItemsList } from "./BlockedItemsList";
import { RecentOrdersSection } from "./RecentOrdersSection";
import {
  BlockedItem,
  RecentOrder,
  SpendingSummary,
  StudentData,
} from "@/types/childProfileTypes";

interface Props {
  student: StudentData;
  blockedItems: BlockedItem[];
  recentOrders: RecentOrder[];
  spendingSummary: SpendingSummary;
}

export function ChildProfileClient({
  student,
  blockedItems,
  recentOrders,
  spendingSummary,
}: Props) {
  const { toasts, dismiss } = useToast();

  return (
    <>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <Link
            href="/parent/children"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary) transition-colors shrink-0 border border-(--border-card)"
          >
            <ArrowLeft size={15} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-(--text-primary) leading-tight truncate">
              Child Profile
            </h1>
            <p className="text-xs text-(--text-muted) mt-0.5">
              Manage settings, allergens &amp; spending limits
            </p>
          </div>
        </div>

        <StudentIdentityCard
          student={student}
          allergenCount={student.allergens.length}
          blockedCount={blockedItems.length}
        />

        <SpendingSummarySection summary={spendingSummary} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingLimitsForm student={student} />
          <RecentOrdersSection orders={recentOrders} studentId={student.id} />
        </div>

        <AllergenSelector student={student} />

        <BlockedItemsList blockedItems={blockedItems} studentId={student.id} />
      </div>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}
