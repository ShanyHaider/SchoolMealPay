"use client";

// app/(dashboard)/parent/_components/ChildrenCards.tsx
// Uses toast (sonner) instead of alert(). Zod validated. Matches admin action patterns.

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Settings,
  ShieldAlert,
  CreditCard,
  Calendar,
  User,
  Plus,
  Minus,
  ShoppingCart,
  Sliders,
  X,
  Store,
  CheckCircle,
} from "lucide-react";
import { toggleStudentOrdering, upsertChildProfile } from "@/db/actions/Students";
import { createOrder, fetchDailyMenuAction } from "@/db/actions/Orders";
import {
  updateSpendingLimitSchema,
  createOrderPayloadSchema,
} from "@/lib/validations/schoolProfile";

// ─── Constants ────────────────────────────────────────────────────────────────

const SLIDER_MIN = 100;   // PKR
const SLIDER_MAX = 5000;  // PKR — adjust to match your school's policy
const SLIDER_STEP = 50;   // PKR

// ─── Types ────────────────────────────────────────────────────────────────────

type ChildLink = {
  id: string;
  status: string;
  student: {
    id: string;
    name: string;
    studentCode: string;
    orderingEnabled: boolean;
    imageUrl: string | null;
    classId: string | null;
    class?: { grade: string; section: string } | null;
    childProfile?: {
      dailySpendingLimit: string | null;
      weeklySpendingLimit: string | null;
      dietaryPreferences: string | null;
      medicalNotes: string | null;
    } | null;
    allergens: { allergen: string }[];
  };
};

interface ChildrenCardsProps {
  children: ChildLink[];
  canteens: any[];
  parentId: string;
}

export function ChildrenCards({ children, canteens, parentId }: ChildrenCardsProps) {
  const [isPending, startTransition] = useTransition();

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<ChildLink["student"] | null>(null);
  const [selectedCanteenId, setSelectedCanteenId] = useState(canteens[0]?.id ?? "");
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<string, { item: any; qty: number }>>({});
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Fetch menu when canteen/drawer changes
  useEffect(() => {
    if (!selectedCanteenId || !isDrawerOpen) return;
    const todayStr = new Date().toISOString().split("T")[0];
    let active = true;

    fetchDailyMenuAction(selectedCanteenId, todayStr).then((res) => {
      if (!active) return;
      setMenuItems(res.map((r: any) => ({ ...r.menuItem, mealSlot: r.mealSlot })));
      setCart({});
    });

    return () => { active = false; };
  }, [selectedCanteenId, isDrawerOpen]);

  const openQuickOrder = (student: ChildLink["student"]) => {
    setActiveStudent(student);
    setIsDrawerOpen(true);
    setCheckoutSuccess(false);
    setCart({});
  };

  const updateCartQty = (itemId: string, item: any, diff: number) => {
    setCart((prev) => {
      const current = prev[itemId]?.qty ?? 0;
      const newQty = current + diff;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: { item, qty: newQty } };
    });
  };

  const handlePlaceOrder = () => {
    if (!activeStudent) return;
    const todayStr = new Date().toISOString().split("T")[0];

    const orderItems = Object.entries(cart).map(([itemId, entry]) => ({
      menuItemId: itemId,
      quantity: entry.qty,
    }));

    const totalAmount = Object.values(cart)
      .reduce((sum, entry) => sum + parseFloat(entry.item.price) * entry.qty, 0)
      .toFixed(2);

    const payload = {
      studentId: activeStudent.id,
      canteenId: selectedCanteenId,
      orderDate: todayStr,
      paymentMethod: "wallet" as const,
      items: orderItems,
    };

    const result = createOrderPayloadSchema.safeParse(payload);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Checkout validation error.");
      return;
    }

    startTransition(async () => {
      try {
        await createOrder({
          order: {
            studentId: activeStudent.id,
            parentId,
            canteenId: selectedCanteenId,
            totalAmount,
            taxAmount: "0.00",
            orderDate: todayStr,
            preparationDeadlineAt: new Date(Date.now() + 30 * 60 * 1000),
            isRecurring: false,
          },
          items: orderItems.map((oi) => {
            const match = cart[oi.menuItemId];
            return {
              menuItemId: oi.menuItemId,
              quantity: oi.quantity,
              unitPrice: match ? parseFloat(match.item.price).toFixed(2) : "0.00",
            };
          }),
          paymentMethod: "wallet",
        });
        setCheckoutSuccess(true);
        setCart({});
        toast.success("Order placed successfully!");
        setTimeout(() => setIsDrawerOpen(false), 1800);
      } catch (err: any) {
        toast.error(err?.message ?? "Checkout failed. Please try again.");
      }
    });
  };

  if (children.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-4 py-16 rounded-xl border"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <User size={24} className="text-zinc-400" />
        </div>
        <div className="text-center">
          <p className="font-bold" style={{ color: "var(--text-primary)" }}>
            No children linked
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Link your child&apos;s profile to start ordering meals.
          </p>
        </div>
        <Link
          href="/parent/children/link"
          className="px-4 py-2 rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
          style={{
            background: "var(--accent)",
            color: "var(--accent-text)",
          }}
        >
          Link a child
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {children.map((link) => (
        <ChildCard
          key={link.id}
          link={link}
          onQuickOrder={() => openQuickOrder(link.student)}
        />
      ))}

      {/* Quick-order drawer */}
      {isDrawerOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md h-full flex flex-col shadow-2xl"
            style={{
              background: "var(--bg-card)",
              borderLeft: "1px solid var(--border-primary)",
            }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} style={{ color: "var(--text-primary)" }} />
                <h3
                  className="text-sm font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-primary)" }}
                >
                  Quick Pre-Order
                </h3>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Student badge */}
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-card)",
                }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Ordering For
                </p>
                <p
                  className="text-sm font-black mt-0.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  {activeStudent.name}
                </p>
                <p className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
                  #{activeStudent.studentCode}
                </p>
              </div>

              {/* Canteen selector */}
              <div className="space-y-2">
                <label
                  className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Store size={12} /> Select Canteen
                </label>
                <select
                  value={selectedCanteenId}
                  onChange={(e) => setSelectedCanteenId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-bold rounded-lg outline-none transition-all cursor-pointer"
                  style={{
                    border: "1px solid var(--border-card)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }}
                >
                  {canteens.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Menu items */}
              <div className="space-y-3">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider px-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Today&apos;s Scheduled Meals
                </p>
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {menuItems.length === 0 ? (
                    <p
                      className="text-xs italic text-center py-8"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No scheduled menu items for today.
                    </p>
                  ) : (
                    menuItems.map((item) => {
                      const qty = cart[item.id]?.qty ?? 0;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-xl border"
                          style={{
                            background: "var(--bg-card)",
                            borderColor: "var(--border-card)",
                          }}
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <p
                              className="text-xs font-bold truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {item.name}
                            </p>
                            <p
                              className="text-[10px] font-medium mt-0.5"
                              style={{ color: "var(--text-muted)" }}
                            >
                              PKR {Math.round(parseFloat(item.price))} · {item.mealSlot}
                            </p>
                          </div>

                          {qty > 0 ? (
                            <div
                              className="flex items-center gap-2.5 rounded-lg p-1 border"
                              style={{
                                background: "var(--bg-secondary)",
                                borderColor: "var(--border-card)",
                              }}
                            >
                              <button
                                onClick={() => updateCartQty(item.id, item, -1)}
                                className="w-6 h-6 rounded flex items-center justify-center text-xs transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                style={{ color: "var(--text-primary)" }}
                              >
                                <Minus size={11} />
                              </button>
                              <span
                                className="text-xs font-bold min-w-[12px] text-center"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {qty}
                              </span>
                              <button
                                onClick={() => updateCartQty(item.id, item, 1)}
                                className="w-6 h-6 rounded flex items-center justify-center text-xs transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                style={{ color: "var(--text-primary)" }}
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => updateCartQty(item.id, item, 1)}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95"
                              style={{
                                background: "var(--accent)",
                                color: "var(--accent-text)",
                              }}
                            >
                              Add
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Drawer footer */}
            <div
              className="border-t p-6 space-y-4"
              style={{ borderColor: "var(--border-primary)", background: "var(--bg-card)" }}
            >
              {checkoutSuccess && (
                <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5 text-green-600 text-xs font-medium flex items-center gap-2">
                  <CheckCircle size={14} /> Order placed successfully!
                </div>
              )}

              <div className="flex justify-between items-center px-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  Total
                </span>
                <span className="text-lg font-black" style={{ color: "var(--text-primary)" }}>
                  PKR{" "}
                  {Math.round(
                    Object.values(cart).reduce(
                      (sum, e) => sum + parseFloat(e.item.price) * e.qty,
                      0,
                    ),
                  )}
                </span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isPending || Object.keys(cart).length === 0 || checkoutSuccess}
                className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 border border-green-500/20 bg-green-500/10 text-green-600 hover:bg-green-500/20"
              >
                {isPending ? "Submitting…" : "Confirm & Pay via Wallet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Child Card ───────────────────────────────────────────────────────────────

interface ChildCardProps {
  link: ChildLink;
  onQuickOrder: () => void;
}

function ChildCard({ link, onQuickOrder }: ChildCardProps) {
  const { student } = link;
  const [isPending, startTransition] = useTransition();

  // Clamp the saved limit into the slider range so the thumb always renders correctly
  const savedLimit = student.childProfile?.dailySpendingLimit
    ? Math.min(
      Math.max(parseFloat(student.childProfile.dailySpendingLimit), SLIDER_MIN),
      SLIDER_MAX,
    )
    : SLIDER_MIN;

  const [sliderLimit, setSliderLimit] = useState(savedLimit);
  const [hasChanges, setHasChanges] = useState(false);

  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleStudentOrdering(student.id, !student.orderingEnabled);
        toast.success(
          student.orderingEnabled ? "Ordering paused." : "Ordering enabled.",
        );
      } catch {
        toast.error("Failed to update ordering status.");
      }
    });
  };

  const handleSaveLimit = () => {
    const result = updateSpendingLimitSchema.safeParse({
      studentId: student.id,
      dailySpendingLimit: sliderLimit,
    });

    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Limit validation failed.");
      return;
    }

    startTransition(async () => {
      try {
        await upsertChildProfile({
          studentId: student.id,
          dailySpendingLimit: sliderLimit.toFixed(0),
          weeklySpendingLimit: student.childProfile?.weeklySpendingLimit ?? null,
          dietaryPreferences: student.childProfile?.dietaryPreferences ?? null,
          medicalNotes: student.childProfile?.medicalNotes ?? null,
        });
        setHasChanges(false);
        toast.success("Spending limit updated.");
      } catch {
        toast.error("Failed to update spending limit.");
      }
    });
  };

  return (
    <div
      className="rounded-xl border p-6 transition-all hover:shadow-md"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        {/* Avatar */}
        <div className="relative shrink-0 self-start">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold overflow-hidden border"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
            }}
          >
            {student.imageUrl ? (
              <img
                src={student.imageUrl}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div
            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white dark:border-zinc-900 ${student.orderingEnabled ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Name row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {student.name}
              </h3>
              <div
                className="flex items-center gap-2 text-xs font-medium mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                <User size={13} />
                {student.class ? (
                  <span>
                    Grade {student.class.grade} · Section {student.class.section}
                  </span>
                ) : (
                  <span>ID: {student.studentCode}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onQuickOrder}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                }}
              >
                <ShoppingCart size={13} /> Quick Order
              </button>

              <button
                onClick={handleToggle}
                disabled={isPending}
                className={`text-xs px-4 py-2 rounded-xl font-bold transition-all border ${student.orderingEnabled
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                  : "bg-transparent text-zinc-400 border-zinc-200 hover:text-zinc-900 hover:border-zinc-400 dark:border-zinc-700"
                  }`}
              >
                {student.orderingEnabled ? "Ordering On" : "Ordering Paused"}
              </button>

              <Link
                href={`/parent/children/${student.id}`}
                className="flex items-center justify-center w-10 h-10 rounded-xl border transition-all hover:bg-[var(--bg-tertiary)]"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-card)",
                  color: "var(--text-secondary)",
                }}
              >
                <Settings size={16} />
              </Link>
            </div>
          </div>

          {/* Spending limit slider */}
          <div
            className="p-4 rounded-xl border space-y-3"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border-card)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                <Sliders size={12} /> Daily Spending Limit
              </span>
              <span
                className="text-xs font-black"
                style={{ color: "var(--text-primary)" }}
              >
                PKR {Math.round(sliderLimit)} / PKR {SLIDER_MAX} max
              </span>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min={SLIDER_MIN}
                max={SLIDER_MAX}
                step={SLIDER_STEP}
                value={sliderLimit}
                onChange={(e) => {
                  setSliderLimit(parseFloat(e.target.value));
                  setHasChanges(true);
                }}
                className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                style={{ background: "var(--border-card)" }}
              />
              {hasChanges && (
                <button
                  onClick={handleSaveLimit}
                  disabled={isPending}
                  className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase hover:opacity-90 transition-all"
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-text)",
                  }}
                >
                  Apply
                </button>
              )}
            </div>
          </div>

          {/* Allergens & dietary */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t"
            style={{ borderColor: "var(--border-primary)" }}
          >
            <div>
              <div
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                <ShieldAlert size={12} /> Allergens
              </div>
              <div className="flex flex-wrap gap-1.5">
                {student.allergens.length > 0 ? (
                  student.allergens.map((a) => (
                    <span
                      key={a.allergen}
                      className="text-[10px] px-2 py-0.5 rounded-lg font-bold border"
                      style={{
                        background: "var(--bg-secondary)",
                        borderColor: "var(--border-card)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {a.allergen}
                    </span>
                  ))
                ) : (
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    None
                  </span>
                )}
              </div>
            </div>

            <div>
              <div
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                <Calendar size={12} /> Dietary Notes
              </div>
              <p
                className="text-xs font-bold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {student.childProfile?.dietaryPreferences || "Standard Plan"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}