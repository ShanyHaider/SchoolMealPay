// // app/(dashboard)/parent/_components/children/QuickOrderDrawer.tsx
// "use client";

// import { ShoppingCart, X, Store, Minus, Plus, CheckCircle, AlertTriangle } from "lucide-react";
// import { PortalSelect } from "@/components/PortalSelect";
// import type { Student, MenuItem, Cart, Canteen } from "@/types/parentDashboardTypes";

// interface QuickOrderDrawerProps {
//     isOpen: boolean;
//     activeStudent: Student | null;
//     canteens: Canteen[];
//     selectedCanteenId: string;
//     menuItems: MenuItem[];
//     cart: Cart;
//     cartTotal: number;
//     checkoutSuccess: boolean;
//     isPending: boolean;
//     onClose: () => void;
//     onCanteenChange: (id: string) => void;
//     onUpdateQty: (itemId: string, item: MenuItem, diff: number) => void;
//     onPlaceOrder: () => void;
//     limitWarning: { message: string; code: string } | null;
//     onForceOrder: () => void;
//     onDismissWarning: () => void;
// }

// export function QuickOrderDrawer({
//     isOpen,
//     activeStudent,
//     canteens,
//     selectedCanteenId,
//     menuItems,
//     cart,
//     cartTotal,
//     checkoutSuccess,
//     isPending,
//     onClose,
//     onCanteenChange,
//     onUpdateQty,
//     onPlaceOrder,
//     limitWarning,       // ← add
//     onForceOrder,       // ← add
//     onDismissWarning,   // ← add
// }: QuickOrderDrawerProps) {
//     if (!isOpen || !activeStudent) return null;

//     const canteenOptions = canteens.map((c) => ({ value: c.id, label: c.name }));
//     const itemCount = Object.values(cart).reduce((s, e) => s + e.qty, 0);

//     return (
//         <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
//             {/* Backdrop tap-to-close */}
//             <div className="absolute inset-0" onClick={onClose} aria-hidden />

//             <div
//                 className="relative w-full max-w-md h-full flex flex-col shadow-2xl"
//                 style={{
//                     background: "var(--bg-card)",
//                     borderLeft: "1px solid var(--border-primary)",
//                 }}
//             >
//                 {/* ── Header ── */}
//                 <div
//                     className="flex items-center justify-between px-5 py-4 border-b"
//                     style={{ borderColor: "var(--border-primary)" }}
//                 >
//                     <div className="flex items-center gap-2">
//                         <ShoppingCart size={16} style={{ color: "var(--accent)" }} />
//                         <h3
//                             className="text-sm font-bold uppercase tracking-widest"
//                             style={{ color: "var(--text-primary)" }}
//                         >
//                             Quick Pre-Order
//                         </h3>
//                     </div>
//                     <button
//                         onClick={onClose}
//                         className="p-1.5 rounded-lg transition-colors hover:bg-(--bg-secondary)"
//                         style={{ color: "var(--text-secondary)" }}
//                         aria-label="Close drawer"
//                     >
//                         <X size={18} />
//                     </button>
//                 </div>

//                 {/* ── Body ── */}
//                 <div className="flex-1 overflow-y-auto p-5 space-y-5">
//                     {/* Student badge */}
//                     <div
//                         className="p-4 rounded-xl border"
//                         style={{
//                             background: "var(--bg-secondary)",
//                             borderColor: "var(--border-card)",
//                         }}
//                     >
//                         <p
//                             className="text-[10px] font-bold uppercase tracking-wider"
//                             style={{ color: "var(--text-muted)" }}
//                         >
//                             Ordering For
//                         </p>
//                         <p
//                             className="text-sm font-black mt-0.5"
//                             style={{ color: "var(--text-primary)" }}
//                         >
//                             {activeStudent.name}
//                         </p>
//                         <p className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
//                             #{activeStudent.studentCode}
//                         </p>
//                     </div>

//                     {/* Canteen selector — PortalSelect */}
//                     <PortalSelect
//                         options={canteenOptions}
//                         value={selectedCanteenId}
//                         onChange={(val) => val && onCanteenChange(val)}
//                         label="Select Canteen"
//                         triggerIcon={<Store size={14} />}
//                     />

//                     {/* Menu items */}
//                     <div className="space-y-2">
//                         <p
//                             className="text-[10px] font-bold uppercase tracking-wider px-0.5"
//                             style={{ color: "var(--text-muted)" }}
//                         >
//                             Today&apos;s Scheduled Meals
//                         </p>

//                         {menuItems.length === 0 ? (
//                             <div
//                                 className="py-10 text-center rounded-xl border"
//                                 style={{
//                                     borderColor: "var(--border-card)",
//                                     background: "var(--bg-secondary)",
//                                 }}
//                             >
//                                 <p className="text-xs" style={{ color: "var(--text-muted)" }}>
//                                     No scheduled menu items for today.
//                                 </p>
//                             </div>
//                         ) : (
//                             <div className="space-y-2">
//                                 {menuItems.map((item) => {
//                                     const qty = cart[item.id]?.qty ?? 0;
//                                     return (
//                                         <MenuItemRow
//                                             key={item.id}
//                                             item={item}
//                                             qty={qty}
//                                             onAdd={() => onUpdateQty(item.id, item, 1)}
//                                             onRemove={() => onUpdateQty(item.id, item, -1)}
//                                         />
//                                     );
//                                 })}
//                             </div>
//                         )}
//                     </div>
//                 </div>

//                 {/* ── Footer ── */}
//                 <div
//                     className="border-t p-5 space-y-4"
//                     style={{ borderColor: "var(--border-primary)", background: "var(--bg-card)" }}
//                 >
//                     {checkoutSuccess && (
//                         <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5 text-green-600 text-xs font-medium flex items-center gap-2">
//                             <CheckCircle size={14} /> Order placed successfully!
//                         </div>
//                     )}

//                     {/* Cart summary */}
//                     <div className="flex justify-between items-end px-1">
//                         <div>
//                             <span
//                                 className="text-[10px] font-bold uppercase tracking-widest block"
//                                 style={{ color: "var(--text-muted)" }}
//                             >
//                                 Total
//                             </span>
//                             {itemCount > 0 && (
//                                 <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
//                                     {itemCount} item{itemCount !== 1 ? "s" : ""}
//                                 </span>
//                             )}
//                         </div>
//                         <span className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
//                             PKR {Math.round(cartTotal).toLocaleString()}
//                         </span>
//                     </div>

//                     {/* Limit warning */}
//                     {limitWarning && !checkoutSuccess && (
//                         <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/8 space-y-3">
//                             <div className="flex items-start gap-2">
//                                 <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
//                                 <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-primary)" }}>
//                                     {limitWarning.message}
//                                 </p>
//                             </div>
//                             <div className="flex gap-2">
//                                 <button
//                                     onClick={onDismissWarning}
//                                     className="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all hover:bg-(--bg-secondary)"
//                                     style={{
//                                         borderColor: "var(--border-card)",
//                                         color: "var(--text-secondary)",
//                                     }}
//                                 >
//                                     Cancel
//                                 </button>
//                                 <button
//                                     onClick={onForceOrder}
//                                     disabled={isPending}
//                                     className="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 border border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 active:scale-[0.98]"
//                                 >
//                                     {isPending ? "Submitting…" : "Place Anyway"}
//                                 </button>
//                             </div>
//                         </div>
//                     )}

//                     <button
//                         onClick={onPlaceOrder}
//                         disabled={isPending || Object.keys(cart).length === 0 || checkoutSuccess || !!limitWarning}
//                         className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 border border-green-500/20 bg-green-500/10 text-green-600 hover:bg-green-500/20 active:scale-[0.98]"
//                     >
//                         {isPending ? "Submitting…" : "Confirm & Pay via Wallet"}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }

// // ─── Menu Item Row ────────────────────────────────────────────────────────────

// function MenuItemRow({
//     item,
//     qty,
//     onAdd,
//     onRemove,
// }: {
//     item: MenuItem;
//     qty: number;
//     onAdd: () => void;
//     onRemove: () => void;
// }) {
//     return (
//         <div
//             className="flex items-center justify-between p-3 rounded-xl border"
//             style={{
//                 background: "var(--bg-card)",
//                 borderColor: qty > 0 ? "var(--accent)" : "var(--border-card)",
//                 transition: "border-color 0.15s",
//             }}
//         >
//             <div className="min-w-0 flex-1 pr-3">
//                 <p
//                     className="text-xs font-bold truncate"
//                     style={{ color: "var(--text-primary)" }}
//                 >
//                     {item.name}
//                 </p>
//                 <p
//                     className="text-[10px] font-medium mt-0.5"
//                     style={{ color: "var(--text-muted)" }}
//                 >
//                     PKR {Math.round(parseFloat(item.price)).toLocaleString()} · {item.mealSlot}
//                 </p>
//             </div>

//             {qty > 0 ? (
//                 <div
//                     className="flex items-center gap-2 rounded-lg p-1 border"
//                     style={{
//                         background: "var(--bg-secondary)",
//                         borderColor: "var(--border-card)",
//                     }}
//                 >
//                     <button
//                         onClick={onRemove}
//                         className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95"
//                         style={{ color: "var(--text-primary)" }}
//                         aria-label="Remove one"
//                     >
//                         <Minus size={11} />
//                     </button>
//                     <span
//                         className="text-xs font-bold w-5 text-center tabular-nums"
//                         style={{ color: "var(--text-primary)" }}
//                     >
//                         {qty}
//                     </span>
//                     <button
//                         onClick={onAdd}
//                         className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95"
//                         style={{ color: "var(--text-primary)" }}
//                         aria-label="Add one"
//                     >
//                         <Plus size={11} />
//                     </button>
//                 </div>
//             ) : (
//                 <button
//                     onClick={onAdd}
//                     className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95"
//                     style={{
//                         background: "var(--accent)",
//                         color: "var(--accent-text)",
//                     }}
//                 >
//                     Add
//                 </button>
//             )}
//         </div>
//     );
// }
