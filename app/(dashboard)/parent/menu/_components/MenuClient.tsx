"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/db/actions/Orders";
import {
  ShoppingCart,
  ChefHat,
  User,
  Calendar,
  Store,
  Plus,
  Minus,
  Info,
  Utensils,
  Sparkles,
  Repeat,
} from "lucide-react";
import { PortalSelect } from "@/components/PortalSelect";
import { useToast, ToastContainer } from "@/components/useToast";
import type { NutritionAverages } from "@/types/nutritionTypes";
import type { NutritionTargets } from "@/db/actions/Nutrition";
import { RecurringOrderModal } from "../../_components/RecurringOrderModal";

// Must match the key format used in MealSuggestions.tsx
function suggestionsKey(childName: string) {
  return `meal_suggestions_${childName.toLowerCase().replace(/\s+/g, "_")}`;
}

type SuggestionEntry = {
  suggestions: { name: string; targetNutrients: string[] }[];
  generatedAt: number;
};

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  category: string;
  calories: number | null;
  isVegetarian: boolean;
  isAvailable: boolean;
  isSpecialOfDay: boolean;
};

type Student = {
  id: string;
  name: string;
  imageUrl: string | null;
};

type Canteen = {
  id: string;
  name: string;
  location: string | null;
};

type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

interface MenuClientProps {
  canteens: Canteen[];
  menuItems: MenuItem[];
  students: Student[];
  parentId: string;
  selectedCanteenId: string;
  selectedDate: string;
  today: string;
  // Per-date menu for recurring orders: key = YYYY-MM-DD
  menuByDate: Record<string, { id: string; name: string; price: string }[]>;
  // Nutrition data per child name — enables AI picks in recurring modal
  nutritionByChild?: Record<string, { avg: NutritionAverages; targets: NutritionTargets }>;
}

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id ?? "");
  const [placing, setPlacing] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);

  // Suggested meal names for the selected student, loaded from localStorage.
  // These are now matched against real menu item names (exact, case-insensitive)
  // instead of fuzzy word matching — AI writes exact names since we pass the menu to it.
  const [suggestedNames, setSuggestedNames] = useState<Set<string>>(new Set());
  const [suggestedFor, setSuggestedFor] = useState<string>("");

  useEffect(() => {
    const student = students.find((s) => s.id === selectedStudent);
    if (!student) return;
    try {
      const raw = localStorage.getItem(suggestionsKey(student.name));
      if (!raw) { setSuggestedNames(new Set()); setSuggestedFor(""); return; }
      const { suggestions, generatedAt }: SuggestionEntry = JSON.parse(raw);
      if (Date.now() - generatedAt > 24 * 60 * 60 * 1000) {
        setSuggestedNames(new Set()); setSuggestedFor(""); return;
      }
      // Build a lowercase set for O(1) exact lookup
      setSuggestedNames(new Set(suggestions.map((s) => s.name.toLowerCase())));
      setSuggestedFor(student.name);
    } catch {
      setSuggestedNames(new Set());
      setSuggestedFor("");
    }
  }, [selectedStudent, students]);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // ── Cart helpers ────────────────────────────────────────────────────────────

  function addToCart(item: { id: string; name: string; price: string }) {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: parseFloat(item.price),
          quantity: 1,
        },
      ];
    });
  }

  function removeFromCart(menuItemId: string) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }

  // ── Order placement ─────────────────────────────────────────────────────────

  async function handlePlaceOrder() {
    if (!selectedStudent) { toast("Please select a student.", "warning"); return; }
    if (cart.length === 0) { toast("Your cart is empty.", "warning"); return; }
    if (!selectedCanteenId) { toast("Please select a canteen.", "warning"); return; }

    setPlacing(true);
    try {
      const result = await createOrder({
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
      });

      if (!result.success) {
        if (result.code === "INSUFFICIENT_BALANCE") {
          const match = result.error.match(/Available:\s*([\d.]+)/);
          const available = match ? `PKR ${Math.round(parseFloat(match[1]))}` : "PKR 0";
          toast(`Insufficient balance (${available}). Please top up your wallet.`, "error");
        } else if (result.code === "WALLET_NOT_FOUND") {
          toast("Wallet not found. Please contact support.", "error");
        } else {
          toast(result.error, "error");
        }
        return;
      }

      toast("Order placed successfully!", "success");
      setCart([]);
      setTimeout(() => router.push("/parent/orders"), 1200);
    } catch {
      toast("Network error. Please check your connection.", "error");
    } finally {
      setPlacing(false);
    }
  }

  const maxDateStr = new Date(Date.now() + 7 * 86400000)
    .toISOString()
    .split("T")[0];

  const grouped = menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const slot = (item as any).mealSlot ?? "lunch";
    if (!acc[slot]) acc[slot] = [];
    acc[slot].push(item);
    return acc;
  }, {});

  const canteenOptions = canteens.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: c.location ?? undefined,
    icon: <Store size={14} />,
  }));

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: s.name,
    icon: <User size={14} />,
  }));

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Menu */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-(--bg-card) border border-(--border-card) rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-(--bg-secondary) rounded-xl border border-(--border-card)">
              <Calendar size={16} className="text-(--text-muted)" />
              <input
                type="date"
                value={selectedDate}
                min={today}
                max={maxDateStr}
                onChange={(e) =>
                  router.push(
                    `/parent/menu?date=${e.target.value}&canteen=${selectedCanteenId}`,
                  )
                }
                className="bg-transparent text-sm font-bold text-(--text-primary) outline-none cursor-pointer"
              />
            </div>

            {canteens.length > 1 && (
              <div className="w-56">
                <PortalSelect
                  options={canteenOptions}
                  value={selectedCanteenId}
                  onChange={(val) => {
                    if (val)
                      router.push(
                        `/parent/menu?date=${selectedDate}&canteen=${val}`,
                      );
                  }}
                  triggerIcon={<Store size={14} />}
                  placeholder="Select canteen…"
                  compact
                />
              </div>
            )}

            {/* Schedule recurring — sits at the end of the filters bar */}
            <button
              onClick={() => setShowRecurring(true)}
              className="ml-auto flex items-center gap-2 px-3 py-2 bg-(--bg-secondary) border border-(--border-card) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-primary) rounded-xl text-sm font-medium transition-colors shrink-0"
            >
              <Repeat size={14} />
              <span className="hidden sm:inline">Schedule recurring</span>
              <span className="sm:hidden">Recurring</span>
            </button>
          </div>

          {/* AI recommendation banner */}
          {suggestedNames.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-2xl">
              <Sparkles size={15} className="text-violet-500 shrink-0" />
              <p className="text-sm text-violet-700 dark:text-violet-300">
                <span className="font-semibold">AI recommendations active</span>
                {" "}— meals marked{" "}
                <span className="inline-flex items-center gap-1 font-bold text-violet-600 dark:text-violet-400">
                  ✦ Recommended
                </span>
                {" "}are suggested for {suggestedFor} based on their nutrition analysis.
              </p>
            </div>
          )}

          {/* Menu Sections */}
          {menuItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-(--bg-card) border border-(--border-card) rounded-2xl shadow-sm italic text-(--text-muted)">
              <ChefHat size={48} className="mb-4 opacity-10" />
              <p>No menu items found for this selection.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([slot, items]) => (
              <div key={slot} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-[10px] font-bold text-(--text-muted) uppercase tracking-[0.2em] px-1">
                    {slot}
                  </h3>
                  <div className="h-px flex-1 bg-(--border-card)" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item) => {
                    const menuItem = (item as any).menuItem ?? item;
                    if (!menuItem.isAvailable) return null;
                    const qty =
                      cart.find((i) => i.menuItemId === menuItem.id)?.quantity ?? 0;
                    // Exact match — AI now writes real menu item names
                    const isRecommended = suggestedNames.has(menuItem.name.toLowerCase());

                    return (
                      <div
                        key={menuItem.id}
                        className={`bg-(--bg-card) border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between ${isRecommended
                          ? "border-violet-300 dark:border-violet-700 ring-1 ring-violet-200 dark:ring-violet-800"
                          : "border-(--border-card)"
                          }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col gap-1">
                              <h4 className="text-lg font-bold text-(--text-primary) transition-colors">
                                {menuItem.name}
                              </h4>
                              {isRecommended && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                                  <Sparkles size={9} />
                                  Recommended for {suggestedFor}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-bold text-(--text-primary) shrink-0 ml-2">
                              PKR {Math.round(parseFloat(menuItem.price))}
                            </span>
                          </div>

                          <p className="text-sm text-(--text-secondary) font-medium line-clamp-2 mb-4">
                            {menuItem.description || "Standard nutritious meal."}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-6">
                            {menuItem.isSpecialOfDay && (
                              <span className="text-[11px] px-2 py-0.5 rounded-lg font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                Special
                              </span>
                            )}
                            {menuItem.isVegetarian && (
                              <span className="text-[11px] px-2 py-0.5 rounded-lg font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                                Veg
                              </span>
                            )}
                            {menuItem.calories && (
                              <span className="text-[11px] px-2 py-0.5 rounded-lg font-bold bg-zinc-100 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700">
                                {menuItem.calories} kcal
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border-card)">
                          {qty > 0 ? (
                            <div className="flex items-center gap-4 bg-(--bg-secondary) rounded-xl p-1.5 border border-(--border-card)">
                              <button
                                onClick={() => removeFromCart(menuItem.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-(--bg-card) hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-(--text-primary)"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-sm font-bold min-w-[1rem] text-center">
                                {qty}
                              </span>
                              <button
                                onClick={() => addToCart(menuItem)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-(--bg-card) hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-(--text-primary)"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(menuItem)}
                              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl text-xs font-bold hover:opacity-90 transition-all active:scale-95"
                            >
                              <Plus size={14} /> Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Summary Cart */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="sticky top-24 bg-(--bg-card) border border-(--border-card) rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-(--border-card) pb-4">
              <h2 className="font-bold text-lg text-(--text-primary) flex items-center gap-2">
                <ShoppingCart size={18} />
                Summary
              </h2>
              <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-widest">
                {cartCount} Items
              </span>
            </div>

            <PortalSelect
              options={studentOptions}
              value={selectedStudent}
              onChange={(val) => {
                if (val) setSelectedStudent(val);
              }}
              label="Ordering for"
              triggerIcon={<User size={14} />}
              placeholder="Select student…"
            />

            {/* Cart Items */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {cart.length === 0 ? (
                <div className="text-center py-6">
                  <Utensils
                    size={24}
                    className="mx-auto mb-2 text-(--text-muted) opacity-20"
                  />
                  <p className="text-xs font-medium text-(--text-muted)">
                    Cart is empty
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex justify-between items-start text-sm"
                  >
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-(--text-primary) leading-tight">
                        {item.name}
                      </p>
                      <p className="text-[10px] font-bold text-(--text-muted) mt-0.5 uppercase">
                        {item.quantity} × PKR {Math.round(item.price)}
                      </p>
                    </div>
                    <span className="font-bold text-(--text-primary)">
                      PKR {Math.round(item.price * item.quantity)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Checkout Area */}
            <div className="pt-4 border-t border-(--border-card) space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-widest">
                  Total
                </span>
                <span className="text-xl font-bold text-(--text-primary)">
                  PKR {Math.round(cartTotal)}
                </span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing || cart.length === 0}
                className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm ${placing || cart.length === 0
                  ? "bg-(--bg-secondary) text-(--text-muted) cursor-not-allowed"
                  : "bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20"
                  }`}
              >
                {placing ? "Processing..." : "Place Order"}
              </button>

              <p className="text-[9px] text-(--text-muted) text-center font-bold uppercase tracking-tighter">
                <Info size={10} className="inline mr-1" /> Orders must be placed
                before 7:30 AM
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recurring orders modal */}
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