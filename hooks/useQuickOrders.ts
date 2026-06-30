// app/(dashboard)/parent/hooks/useQuickOrder.ts
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { toast } from "sonner";
import { createOrder, fetchDailyMenuAction } from "@/db/actions/Orders";
import { createOrderPayloadSchema } from "@/lib/validations/schoolProfile";
import type { Student, MenuItem, Cart, Canteen, LimitWarning } from "@/types/parentDashboardTypes";

interface UseQuickOrderOptions {
    canteens: Canteen[];
    parentId: string;
}

export function useQuickOrder({ canteens, parentId }: UseQuickOrderOptions) {
    const [isPending, startTransition] = useTransition();

    const [isOpen, setIsOpen] = useState(false);
    const [activeStudent, setActiveStudent] = useState<Student | null>(null);
    const [selectedCanteenId, setSelectedCanteenId] = useState(canteens[0]?.id ?? "");
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [cart, setCart] = useState<Cart>({});
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [limitWarning, setLimitWarning] = useState<LimitWarning | null>(null);


    // Re-fetch menu whenever canteen or open state changes
    useEffect(() => {
        if (!selectedCanteenId || !isOpen) return;
        const todayStr = new Date().toISOString().split("T")[0];
        let active = true;

        fetchDailyMenuAction(selectedCanteenId, todayStr).then((res: any[]) => {
            if (!active) return;
            setMenuItems(res.map((r) => ({ ...r.menuItem, mealSlot: r.mealSlot })));
            setCart({});
        });

        return () => { active = false; };
    }, [selectedCanteenId, isOpen]);

    const open = useCallback((student: Student) => {
        setActiveStudent(student);
        setIsOpen(true);
        setCheckoutSuccess(false);
        setCart({});
        setLimitWarning(null); // add this
    }, []);

    const close = useCallback(() => setIsOpen(false), []);

    const updateCartQty = useCallback((itemId: string, item: MenuItem, diff: number) => {
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
    }, []);

    const cartTotal = Object.values(cart).reduce(
        (sum, e) => sum + parseFloat(e.item.price) * e.qty,
        0,
    );

    const placeOrder = useCallback((forceLimitOverride = false) => {
        if (!activeStudent) return;
        const todayStr = new Date().toISOString().split("T")[0];

        const orderItems = Object.entries(cart).map(([itemId, entry]) => ({
            menuItemId: itemId,
            quantity: entry.qty,
        }));

        const totalAmount = cartTotal.toFixed(2);

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
                const res = await createOrder({
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
                    forceLimitOverride,
                });

                if (!res.success) {
                    if (
                        res.code === "DAILY_LIMIT_EXCEEDED" ||
                        res.code === "WEEKLY_LIMIT_EXCEEDED"
                    ) {
                        setLimitWarning({ message: res.error, code: res.code });
                        return;
                    }
                    toast.error(res.error);
                    return;
                }

                setLimitWarning(null);
                setCheckoutSuccess(true);
                setCart({});
                toast.success("Order placed successfully!");
                setTimeout(() => setIsOpen(false), 1800);
            } catch (err: any) {
                toast.error(err?.message ?? "Checkout failed. Please try again.");
            }
        });
    }, [activeStudent, cart, selectedCanteenId, parentId, cartTotal]);

    const dismissLimitWarning = useCallback(() => setLimitWarning(null), []);
    const forceOrder = useCallback(() => placeOrder(true), [placeOrder]);

    return {
        isPending,
        isOpen,
        activeStudent,
        selectedCanteenId,
        setSelectedCanteenId,
        menuItems,
        cart,
        cartTotal,
        checkoutSuccess,
        open,
        close,
        updateCartQty,
        placeOrder,
        limitWarning,
        dismissLimitWarning,
        forceOrder,
    };
};