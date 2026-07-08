"use client";

import { useState } from "react";
import type { CartItem } from "./types";
import { formatPKR } from "@/lib/currency";

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  function addToCart(item: { id: string; name: string; price: number }) {
    // Prices can arrive as strings from Drizzle numeric/decimal columns —
    // coerce to a real number here so every downstream consumer (cartTotal,
    // formatPKR, .toFixed() in buildOrderParams) can safely treat it as one.
    const price = Number(item.price);

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
          price,
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

  function clearCart() {
    setCart([]);
  }

  return { cart, cartTotal, cartCount, addToCart, removeFromCart, clearCart };
}
