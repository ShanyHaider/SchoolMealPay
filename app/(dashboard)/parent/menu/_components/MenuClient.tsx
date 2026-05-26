"use client";

import { useState } from "react";
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
} from "lucide-react";

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
}

export function MenuClient({
  canteens,
  menuItems,
  students,
  parentId,
  selectedCanteenId,
  selectedDate,
  today,
}: MenuClientProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id ?? "");
  const [placing, setPlacing] = useState(false);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // Logic functions
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

  async function handlePlaceOrder() {
    if (!selectedStudent || cart.length === 0 || !selectedCanteenId) return;
    setPlacing(true);
    try {
      await createOrder({
        order: {
          studentId: selectedStudent,
          parentId,
          canteenId: selectedCanteenId,
          totalAmount: cartTotal.toFixed(2),
          taxAmount: "0.00",
          orderDate: selectedDate,
          preparationDeadlineAt: new Date(selectedDate + "T07:30:00Z"),
          isRecurring: false,
        },
        items: cart.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          unitPrice: i.price.toFixed(2),
        })),
      });
      setCart([]);
      router.push("/parent/orders");
    } catch (e) {
      console.error(e);
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

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left: Menu */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Filters Bar - Using same secondary bg and border as ChildCard */}
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
            <div className="flex items-center gap-2 px-4 py-2 bg-(--bg-secondary) rounded-xl border border-(--border-card)">
              <Store size={16} className="text-(--text-muted)" />
              <select
                value={selectedCanteenId}
                onChange={(e) =>
                  router.push(
                    `/parent/menu?date=${selectedDate}&canteen=${e.target.value}`,
                  )
                }
                className="bg-transparent text-sm font-bold text-(--text-primary) outline-none cursor-pointer"
              >
                {canteens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Menu Sections */}
        {menuItems.length === 0 ?
          <div className="flex flex-col items-center justify-center py-20 bg-(--bg-card) border border-(--border-card) rounded-2xl shadow-sm italic text-(--text-muted)">
            <ChefHat size={48} className="mb-4 opacity-10" />
            <p>No menu items found for this selection.</p>
          </div>
        : Object.entries(grouped).map(([slot, items]) => (
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
                    cart.find((i) => i.menuItemId === menuItem.id)?.quantity ??
                    0;

                  return (
                    <div
                      key={menuItem.id}
                      className="bg-(--bg-card) border border-(--border-card) rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-bold text-(--text-primary) transition-colors">
                            {menuItem.name}
                          </h4>
                          <span className="text-sm font-bold text-(--text-primary)">
                            ${parseFloat(menuItem.price).toFixed(2)}
                          </span>
                        </div>

                        <p className="text-sm text-(--text-secondary) font-medium line-clamp-2 mb-4">
                          {menuItem.description || "Standard nutritious meal."}
                        </p>

                        {/* Badges - Matching Allergen Colors logic */}
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
                        {qty > 0 ?
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
                        : <button
                            onClick={() => addToCart(menuItem)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl text-xs font-bold hover:opacity-90 transition-all active:scale-95"
                          >
                            <Plus size={14} /> Add to Cart
                          </button>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        }
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

          {/* Student Selector - Same style as ChildCard's ordering button container */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} /> Ordering for
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-3 text-sm font-bold rounded-xl border border-(--border-card) bg-(--bg-secondary) text-(--text-primary) outline-none focus:border-zinc-400 transition-all cursor-pointer"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items */}
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {cart.length === 0 ?
              <div className="text-center py-6">
                <Utensils
                  size={24}
                  className="mx-auto mb-2 text-(--text-muted) opacity-20"
                />
                <p className="text-xs font-medium text-(--text-muted)">
                  Cart is empty
                </p>
              </div>
            : cart.map((item) => (
                <div
                  key={item.menuItemId}
                  className="flex justify-between items-start text-sm"
                >
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-(--text-primary) leading-tight">
                      {item.name}
                    </p>
                    <p className="text-[10px] font-bold text-(--text-muted) mt-0.5 uppercase">
                      {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-bold text-(--text-primary)">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))
            }
          </div>

          {/* Checkout Area */}
          <div className="pt-4 border-t border-(--border-card) space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-widest">
                Total
              </span>
              <span className="text-xl font-bold text-(--text-primary)">
                ${cartTotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing || cart.length === 0}
              className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm ${
                placing || cart.length === 0 ?
                  "bg-(--bg-secondary) text-(--text-muted) cursor-not-allowed"
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
  );
}
