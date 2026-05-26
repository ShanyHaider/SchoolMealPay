"use client";

import { useState, useTransition } from "react";
import {
  createMenuItem,
  deleteMenuItem,
  scheduleDailyMenu,
  removeDailyMenu,
} from "@/db/actions/Admin";
import {
  Plus,
  Trash2,
  CalendarDays,
  UtensilsCrossed,
  Leaf,
  AlertCircle,
} from "lucide-react";

const MEAL_SLOTS = ["breakfast", "lunch", "snack"] as const;
type MealSlot = (typeof MEAL_SLOTS)[number];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CATEGORIES = ["lunch", "snack", "drink", "dessert", "side"];

function getDayDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

const inputStyle = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-input)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 13,
  padding: "8px 12px",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
} as React.CSSProperties;

export function MenuClient({
  menuItems,
  dailyMenus,
  canteens,
  weekStart,
  weekEnd,
  defaultCanteenId,
}: {
  menuItems: any[];
  dailyMenus: any[];
  canteens: any[];
  weekStart: string;
  weekEnd: string;
  defaultCanteenId: string;
}) {
  const [tab, setTab] = useState<"catalogue" | "schedule">("catalogue");
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCanteen, setSelectedCanteen] = useState(defaultCanteenId);
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>("lunch");
  const [schedulingItem, setSchedulingItem] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "lunch",
    calories: "",
    proteinG: "",
    carbsG: "",
    fatG: "",
    fiberG: "",
    isVegetarian: false,
    isVegan: false,
  });
  const [formError, setFormError] = useState("");

  const dayDates = getDayDates(weekStart);

  // Build schedule map: date → slot → menuItem[]
  const scheduleMap: Record<string, Record<string, any[]>> = {};
  for (const dm of dailyMenus) {
    if (!scheduleMap[dm.menuDate]) scheduleMap[dm.menuDate] = {};
    if (!scheduleMap[dm.menuDate][dm.mealSlot])
      scheduleMap[dm.menuDate][dm.mealSlot] = [];
    scheduleMap[dm.menuDate][dm.mealSlot].push(dm);
  }

  const handleCreateItem = () => {
    if (!form.name.trim() || !form.price.trim()) {
      setFormError("Name and price are required.");
      return;
    }
    setFormError("");
    startTransition(async () => {
      await createMenuItem({
        canteenId: selectedCanteen ?? canteens[0]?.id ?? "",
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: form.price,
        category: form.category as "breakfast" | "lunch" | "snack" | "beverage",
        calories: form.calories ? parseInt(form.calories) : undefined,
        proteinG: form.proteinG || undefined,
        carbsG: form.carbsG || undefined,
        fatG: form.fatG || undefined,
        fiberG: form.fiberG || undefined,
        isVegetarian: form.isVegetarian,
        isVegan: form.isVegan,
      });
      setForm({
        name: "",
        description: "",
        price: "",
        category: "lunch",
        calories: "",
        proteinG: "",
        carbsG: "",
        fatG: "",
        fiberG: "",
        isVegetarian: false,
        isVegan: false,
      });
      setShowAdd(false);
    });
  };

  const handleSchedule = (menuItemId: string, date: string) => {
    if (!selectedCanteen) return;
    startTransition(async () => {
      await scheduleDailyMenu({
        canteenId: selectedCanteen,
        menuItemId,
        menuDate: date,
        mealSlot: selectedSlot,
      });
      setSchedulingItem(null);
    });
  };

  const handleRemoveSchedule = (
    canteenId: string,
    menuItemId: string,
    date: string,
    slot: string,
  ) => {
    startTransition(async () => {
      await removeDailyMenu(canteenId, menuItemId, date, slot);
    });
  };

  return (
    <div className="space-y-4">
      {/* Tab bar + controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div
          className="flex rounded-lg p-1 gap-1"
          style={{ background: "var(--bg-pill)" }}
        >
          {(["catalogue", "schedule"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize"
              style={{
                background: tab === t ? "var(--bg-pill-active)" : "transparent",
                color:
                  tab === t ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: tab === t ? "var(--shadow-pill)" : undefined,
              }}
            >
              {t === "catalogue" ?
                `Catalogue (${menuItems.length})`
              : "Weekly Schedule"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {tab === "catalogue" && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: "var(--accent)",
                color: "var(--accent-text)",
                boxShadow: "var(--shadow-btn)",
              }}
            >
              <Plus size={15} /> Add Item
            </button>
          )}
          {tab === "schedule" && canteens.length > 0 && (
            <select
              value={selectedCanteen}
              onChange={(e) => setSelectedCanteen(e.target.value)}
              className="text-sm rounded-lg px-3 py-2"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-input)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            >
              {canteens.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Catalogue Tab ── */}
      {tab === "catalogue" && (
        <>
          {showAdd && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0"
                style={{ background: "rgba(0,0,0,0.5)" }}
                onClick={() => {
                  setShowAdd(false);
                  setFormError("");
                }}
              />
              <div
                className="relative w-full max-w-lg rounded-2xl p-6 z-10 overflow-y-auto max-h-[90vh]"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <h2
                  className="text-lg font-semibold mb-5"
                  style={{ color: "var(--text-primary)" }}
                >
                  Add Menu Item
                </h2>
                {formError && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg mb-3 text-sm"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      color: "#ef4444",
                    }}
                  >
                    <AlertCircle size={14} /> {formError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Name *
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="e.g. Chicken Biryani"
                      style={inputStyle}
                    />
                  </div>
                  <div className="col-span-2">
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Description
                    </label>
                    <input
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      placeholder="Short description"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Price (Rs.) *
                    </label>
                    <input
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                      placeholder="e.g. 150"
                      type="number"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                      style={inputStyle}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="capitalize">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Calories
                    </label>
                    <input
                      value={form.calories}
                      onChange={(e) =>
                        setForm({ ...form, calories: e.target.value })
                      }
                      placeholder="kcal"
                      type="number"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Protein (g)
                    </label>
                    <input
                      value={form.proteinG}
                      onChange={(e) =>
                        setForm({ ...form, proteinG: e.target.value })
                      }
                      placeholder="0.0"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Carbs (g)
                    </label>
                    <input
                      value={form.carbsG}
                      onChange={(e) =>
                        setForm({ ...form, carbsG: e.target.value })
                      }
                      placeholder="0.0"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Fat (g)
                    </label>
                    <input
                      value={form.fatG}
                      onChange={(e) =>
                        setForm({ ...form, fatG: e.target.value })
                      }
                      placeholder="0.0"
                      style={inputStyle}
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-6 mt-1">
                    {[
                      { key: "isVegetarian", label: "Vegetarian" },
                      { key: "isVegan", label: "Vegan" },
                    ].map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={form[key as "isVegetarian" | "isVegan"]}
                          onChange={(e) =>
                            setForm({ ...form, [key]: e.target.checked })
                          }
                          className="w-4 h-4"
                        />
                        <span
                          className="text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => {
                      setShowAdd(false);
                      setFormError("");
                    }}
                    className="flex-1 py-2 rounded-lg text-sm font-medium"
                    style={{
                      background: "var(--bg-tertiary)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-input)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateItem}
                    disabled={isPending}
                    className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{
                      background: "var(--accent)",
                      color: "var(--accent-text)",
                    }}
                  >
                    {isPending ? "Adding..." : "Add Item"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {menuItems.length === 0 ?
            <div
              className="rounded-xl border py-16 text-center"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
              }}
            >
              <UtensilsCrossed
                size={32}
                className="mx-auto mb-3"
                style={{ color: "var(--text-muted)" }}
              />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No menu items yet. Add your first item.
              </p>
            </div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border p-4"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border-card)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.name}
                      </h3>
                      <p
                        className="text-xs capitalize mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {item.category}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Delete this item?"))
                          startTransition(async () => {
                            await deleteMenuItem(item.id);
                          });
                      }}
                      className="p-1.5 rounded-lg"
                      style={{ color: "#ef4444" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-lg font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Rs. {parseFloat(item.price).toFixed(0)}
                    </span>
                    {item.calories && (
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {item.calories} kcal
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {item.isVegetarian && (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{
                          background: "rgba(34,197,94,0.12)",
                          color: "#22c55e",
                        }}
                      >
                        <Leaf size={10} className="inline mr-1" />
                        Veg
                      </span>
                    )}
                    {item.isVegan && (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{
                          background: "rgba(59,130,246,0.12)",
                          color: "#3b82f6",
                        }}
                      >
                        Vegan
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          }
        </>
      )}

      {/* ── Schedule Tab ── */}
      {tab === "schedule" && (
        <div className="space-y-4">
          {!selectedCanteen ?
            <div
              className="rounded-xl border py-12 text-center"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Add a canteen first to schedule menus.
              </p>
            </div>
          : <>
              {/* Slot selector */}
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Meal slot:
                </span>
                <div
                  className="flex rounded-lg p-1 gap-1"
                  style={{ background: "var(--bg-pill)" }}
                >
                  {MEAL_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className="px-3 py-1 rounded-md text-xs font-medium capitalize transition-all"
                      style={{
                        background:
                          selectedSlot === slot ?
                            "var(--bg-pill-active)"
                          : "transparent",
                        color:
                          selectedSlot === slot ?
                            "var(--text-primary)"
                          : "var(--text-secondary)",
                        boxShadow:
                          selectedSlot === slot ? "var(--shadow-pill)" : (
                            undefined
                          ),
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly grid */}
              <div
                className="rounded-xl border overflow-hidden"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border-card)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div
                  className="grid grid-cols-7 border-b"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  {DAYS.map((day, i) => {
                    const date = dayDates[i];
                    const isToday =
                      date === new Date().toISOString().split("T")[0];
                    return (
                      <div
                        key={day}
                        className="px-3 py-3 text-center"
                        style={{
                          borderRight:
                            i < 6 ?
                              "1px solid var(--border-primary)"
                            : undefined,
                          background:
                            isToday ? "rgba(139,92,246,0.06)" : undefined,
                        }}
                      >
                        <p
                          className="text-xs font-semibold"
                          style={{
                            color:
                              isToday ? "#8b5cf6" : "var(--text-secondary)",
                          }}
                        >
                          {day}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {new Date(date + "T00:00:00").toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-7 min-h-[200px]">
                  {dayDates.map((date, i) => {
                    const items = scheduleMap[date]?.[selectedSlot] ?? [];
                    return (
                      <div
                        key={date}
                        className="p-2 min-h-[200px]"
                        style={{
                          borderRight:
                            i < 6 ?
                              "1px solid var(--border-primary)"
                            : undefined,
                        }}
                      >
                        <div className="space-y-1.5">
                          {items.map((dm: any) => (
                            <div
                              key={dm.id}
                              className="group relative rounded-lg p-2 text-xs"
                              style={{
                                background: "rgba(139,92,246,0.1)",
                                border: "1px solid rgba(139,92,246,0.2)",
                              }}
                            >
                              <p
                                className="font-medium leading-tight"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {dm.menuItem?.name}
                              </p>
                              <p style={{ color: "var(--text-muted)" }}>
                                Rs.{" "}
                                {parseFloat(dm.menuItem?.price ?? "0").toFixed(
                                  0,
                                )}
                              </p>
                              <button
                                onClick={() =>
                                  handleRemoveSchedule(
                                    selectedCanteen,
                                    dm.menuItemId,
                                    date,
                                    selectedSlot,
                                  )
                                }
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: "#ef4444" }}
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ))}

                          {/* Add item picker */}
                          {schedulingItem === date ?
                            <div className="space-y-1">
                              <select
                                className="w-full text-xs rounded px-2 py-1"
                                style={{
                                  background: "var(--bg-secondary)",
                                  border: "1px solid var(--border-input)",
                                  color: "var(--text-primary)",
                                  outline: "none",
                                }}
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleSchedule(e.target.value, date);
                                  }
                                }}
                              >
                                <option value="">Pick item…</option>
                                {menuItems.map((mi) => (
                                  <option key={mi.id} value={mi.id}>
                                    {mi.name} — Rs.{" "}
                                    {parseFloat(mi.price).toFixed(0)}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => setSchedulingItem(null)}
                                className="text-xs w-full text-center"
                                style={{ color: "var(--text-muted)" }}
                              >
                                Cancel
                              </button>
                            </div>
                          : <button
                              onClick={() => setSchedulingItem(date)}
                              className="w-full py-1 rounded text-xs transition-all hover:bg-(--bg-tertiary) flex items-center justify-center gap-1"
                              style={{
                                color: "var(--text-muted)",
                                border: "1px dashed var(--border-primary)",
                              }}
                            >
                              <Plus size={10} /> Add
                            </button>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          }
        </div>
      )}
    </div>
  );
}
