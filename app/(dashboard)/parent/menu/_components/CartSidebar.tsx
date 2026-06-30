"use client";

import {
  ShoppingCart,
  User,
  Utensils,
  Info,
  AlertTriangle,
} from "lucide-react";
import { PortalSelect } from "@/components/PortalSelect";
import type { CartItem, Student, LimitWarning } from "./types";
import { formatPKR } from "@/lib/currency";

function Spinner() {
  return (
    <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin inline-block" />
  );
}

interface CartSidebarProps {
  cart: CartItem[];
  cartTotal: number;
  cartCount: number;
  students: Student[];
  selectedStudent: string;
  onStudentChange: (id: string) => void;
  placing: boolean;
  limitWarning: LimitWarning | null;
  onPlaceOrder: () => void;
  onForceOrder: () => void;
  onDismissWarning: () => void;
}

export function CartSidebar({
  cart,
  cartTotal,
  cartCount,
  students,
  selectedStudent,
  onStudentChange,
  placing,
  limitWarning,
  onPlaceOrder,
  onForceOrder,
  onDismissWarning,
}: CartSidebarProps) {
  const studentOptions = students.map((s) => ({
    value: s.id,
    label: s.name,
    icon: <User size={14} />,
  }));

  return (
    <div className="w-full lg:w-80 shrink-0">
      <div className="sticky top-24 bg-(--bg-card) border border-(--border-card) rounded-2xl p-6 shadow-sm flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-(--border-card) pb-4">
          <h2 className="font-bold text-lg text-(--text-primary) flex items-center gap-2">
            <ShoppingCart size={18} />
            Summary
          </h2>
          <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-widest">
            {cartCount} Items
          </span>
        </div>

        {/* Student selector */}
        <PortalSelect
          options={studentOptions}
          value={selectedStudent}
          onChange={(val) => {
            if (val) onStudentChange(val);
          }}
          label="Ordering for"
          triggerIcon={<User size={14} />}
          placeholder="Select student…"
        />

        {/* Cart items */}
        <div className="space-y-4 max-h-75 overflow-y-auto pr-2">
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
                    {item.quantity} × {formatPKR(item.price)}
                  </p>
                </div>
                <span className="font-bold text-(--text-primary)">
                  {formatPKR(item.price * item.quantity)}
                </span>
              </div>
            ))
          }
        </div>

        {/* Checkout area */}
        <div className="pt-4 border-t border-(--border-card) space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-widest">
              Total
            </span>
            <span className="text-xl font-bold text-(--text-primary)">
              {formatPKR(cartTotal)}
            </span>
          </div>

          {limitWarning ?
            <div className="flex flex-col gap-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={14}
                  className="text-amber-500 shrink-0 mt-0.5"
                />
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-snug">
                  {limitWarning.message}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onDismissWarning}
                  className="flex-1 py-2 rounded-lg border border-(--border-card) text-xs font-semibold text-(--text-secondary) hover:text-(--text-primary) transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onForceOrder}
                  disabled={placing}
                  className="flex-1 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-600 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                >
                  {placing ?
                    <Spinner />
                  : "Place anyway"}
                </button>
              </div>
            </div>
          : <button
              onClick={onPlaceOrder}
              disabled={placing || cart.length === 0}
              className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm ${
                placing || cart.length === 0 ?
                  "bg-(--bg-secondary) text-(--text-muted) cursor-not-allowed"
                : "bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20"
              }`}
            >
              {placing ? "Processing..." : "Place Order"}
            </button>
          }

          <p className="text-[9px] text-(--text-muted) text-center font-bold uppercase tracking-tighter">
            <Info size={10} className="inline mr-1" /> Orders must be placed
            before 7:30 AM
          </p>
        </div>
      </div>
    </div>
  );
}
