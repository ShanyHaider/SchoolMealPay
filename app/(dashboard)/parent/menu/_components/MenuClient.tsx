"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createOrder } from "@/db/actions/Orders";
import { useToast, ToastContainer } from "@/components/useToast";
import { RecurringOrderModal } from "./RecurringOrderModal";

import { useCart } from "./useCart";
import { useSuggestions } from "./useSuggestions";
import { MenuFiltersBar } from "./MenuFiltersBar";
import { MenuSection } from "./MenuSection";
import { CartSidebar } from "./CartSidebar";
import type { MenuClientProps, LimitWarning } from "./types";
import { formatPKR } from "@/lib/currency";

export function MenuClient({
  canteens,
  menuItems,
  students,
  parentId,
  selectedCanteenId,
  selectedDate,
  today,
  menuByDate,
  nutritionByChild = {},
}: MenuClientProps) {
  const router = useRouter();
  const { toasts, toast, dismiss } = useToast();
  const { cart, cartTotal, cartCount, addToCart, removeFromCart, clearCart } =
    useCart();
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id ?? "");
  const [placing, setPlacing] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [limitWarning, setLimitWarning] = useState<LimitWarning | null>(null);

  const { suggestedNames, suggestedFor } = useSuggestions(
    selectedStudent,
    students,
  );

  // ── Group menu items by meal slot ────────────────────────────────────────────

  const groupedItems = menuItems.reduce<Record<string, typeof menuItems>>(
    (acc, item) => {
      const slot = (item as any).mealSlot ?? "lunch";
      if (!acc[slot]) acc[slot] = [];
      acc[slot].push(item);
      return acc;
    },
    {},
  );

  // ── Build order payload ──────────────────────────────────────────────────────

  function buildOrderParams(forceLimitOverride = false) {
    return {
      order: {
        studentId: selectedStudent,
        parentId,
        canteenId: selectedCanteenId,
        totalAmount: cartTotal.toFixed(0),
        taxAmount: "0",
        orderDate: selectedDate,
        preparationDeadlineAt: new Date(selectedDate + "T07:30:00Z"),
        isRecurring: false,
      },
      items: cart.map((i) => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        unitPrice: i.price.toFixed(0),
      })),
      forceLimitOverride,
    };
  }

  // ── Handle server result ─────────────────────────────────────────────────────

  function handleOrderResult(result: Awaited<ReturnType<typeof createOrder>>) {
    if (!result.success) {
      if (result.code === "INSUFFICIENT_BALANCE") {
        const match = result.error.match(/Available:\s*([\d.]+)/);
        const available =
          match ? `${formatPKR(parseFloat(match[1]))}` : "PKR 0";
        toast(
          `Insufficient balance (${available}). Please top up your wallet.`,
          "error",
        );
      } else if (result.code === "WALLET_NOT_FOUND") {
        toast("Wallet not found. Please contact support.", "error");
      } else if (
        result.code === "DAILY_LIMIT_EXCEEDED" ||
        result.code === "WEEKLY_LIMIT_EXCEEDED"
      ) {
        setLimitWarning({ message: result.error, type: result.code });
      } else {
        toast(result.error, "error");
      }
      return false;
    }
    return true;
  }

  // ── Order placement ──────────────────────────────────────────────────────────

  async function handlePlaceOrder() {
    if (!selectedStudent) {
      toast("Please select a student.", "warning");
      return;
    }
    if (cart.length === 0) {
      toast("Your cart is empty.", "warning");
      return;
    }
    if (!selectedCanteenId) {
      toast("Please select a canteen.", "warning");
      return;
    }

    setPlacing(true);
    try {
      const result = await createOrder(buildOrderParams(false));
      if (handleOrderResult(result)) {
        toast("Order placed successfully!", "success");
        clearCart();
        setTimeout(() => router.push("/parent/orders"), 1200);
      }
    } catch {
      toast("Network error. Please check your connection.", "error");
    } finally {
      setPlacing(false);
    }
  }

  async function handleForceOrder() {
    setLimitWarning(null);
    setPlacing(true);
    try {
      const result = await createOrder(buildOrderParams(true));
      if (handleOrderResult(result)) {
        toast("Order placed successfully!", "success");
        clearCart();
        setTimeout(() => router.push("/parent/orders"), 1200);
      }
    } catch {
      toast("Network error. Please check your connection.", "error");
    } finally {
      setPlacing(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: menu */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <MenuFiltersBar
            canteens={canteens}
            selectedCanteenId={selectedCanteenId}
            selectedDate={selectedDate}
            today={today}
            onScheduleRecurring={() => setShowRecurring(true)}
          />

          {/* AI recommendation banner */}
          {suggestedNames.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-2xl">
              <Sparkles size={15} className="text-violet-500 shrink-0" />
              <p className="text-sm text-violet-700 dark:text-violet-300">
                <span className="font-semibold">AI recommendations active</span>
                {" — meals marked "}
                <span className="inline-flex items-center gap-1 font-bold text-violet-600 dark:text-violet-400">
                  ✦ Recommended
                </span>
                {` are suggested for ${suggestedFor} based on their nutrition analysis.`}
              </p>
            </div>
          )}

          <MenuSection
            groupedItems={groupedItems}
            cart={cart}
            suggestedNames={suggestedNames}
            suggestedFor={suggestedFor}
            onAdd={addToCart}
            onRemove={removeFromCart}
          />
        </div>

        {/* Right: cart */}
        <CartSidebar
          cart={cart}
          cartTotal={cartTotal}
          cartCount={cartCount}
          students={students}
          selectedStudent={selectedStudent}
          onStudentChange={setSelectedStudent}
          placing={placing}
          limitWarning={limitWarning}
          onPlaceOrder={handlePlaceOrder}
          onForceOrder={handleForceOrder}
          onDismissWarning={() => setLimitWarning(null)}
        />
      </div>

      {showRecurring && (
        <RecurringOrderModal
          students={students}
          parentId={parentId}
          canteenId={selectedCanteenId}
          menuByDate={menuByDate}
          nutritionByChild={nutritionByChild}
          onClose={() => setShowRecurring(false)}
          onSuccess={() => {
            setShowRecurring(false);
            toast("Recurring meals scheduled!", "success");
            setTimeout(() => router.push("/parent/orders"), 1200);
          }}
        />
      )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}
