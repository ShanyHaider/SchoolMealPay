"use client";

import { useTransition } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Coffee, Cookie, Droplets } from "lucide-react";
import { UtensilsCrossed as ForkKnife } from "lucide-react";
import { createMenuItem, updateMenuItem } from "@/db/actions/admin/Canteen";
import {
  createMenuItemSchema,
  updateMenuItemSchema,
} from "@/lib/validations/validators";
import { CustomSelect } from "./CustomSelect";
import {
  ITEM_CATEGORIES,
  type ItemCategory,
  inputStyle,
  type MenuItem,
} from "../../../../../types/canteenMenuTypes";
import {
  menuItemFormSchema,
  type MenuItemFormValues,
} from "@/lib/validations/canteen";

// ─── Category icons ───────────────────────────────────────────────────────────

export const CATEGORY_ICONS_JSX: Record<ItemCategory, React.ReactNode> = {
  breakfast: <Coffee size={12} />,
  lunch: <ForkKnife size={12} />,
  snack: <Cookie size={12} />,
  beverage: <Droplets size={12} />,
};

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Props ────────────────────────────────────────────────────────────────────

interface MenuItemModalProps {
  item?: MenuItem;
  canteenId: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="block text-xs font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MenuItemModal({
  item,
  canteenId,
  onClose,
  onSuccess,
  onError,
}: MenuItemModalProps) {
  const isEditing = item !== undefined;
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues:
      isEditing ?
        {
          name: item.name,
          description: item.description ?? "",
          price: String(item.price),
          category: (item.category as ItemCategory) ?? "lunch",
          calories: item.calories != null ? String(item.calories) : "",
          proteinG: item.proteinG ?? "",
          carbsG: item.carbsG ?? "",
          fatG: item.fatG ?? "",
          fiberG: item.fiberG ?? "",
          isVegetarian: item.isVegetarian ?? false,
          isVegan: item.isVegan ?? false,
        }
      : {
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
        },
  });

  const nameValue = watch("name");
  const priceValue = watch("price");
  const isSubmitDisabled =
    isPending ||
    !nameValue?.trim() ||
    !priceValue?.trim() ||
    (isEditing && !isDirty);

  const onSubmit = (data: MenuItemFormValues) => {
    const basePayload = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      price: data.price,
      category: data.category,
      calories: data.calories ? parseInt(data.calories) : undefined,
      proteinG: data.proteinG || undefined,
      carbsG: data.carbsG || undefined,
      fatG: data.fatG || undefined,
      fiberG: data.fiberG || undefined,
      isVegetarian: data.isVegetarian,
      isVegan: data.isVegan,
    };

    startTransition(async () => {
      try {
        if (isEditing) {
          const parsed = updateMenuItemSchema.parse(basePayload);
          await updateMenuItem(item.id, parsed);
          onSuccess(`"${basePayload.name}" updated.`);
        } else {
          const parsed = createMenuItemSchema.parse({
            canteenId,
            ...basePayload,
          });
          await createMenuItem(parsed);
          onSuccess(`"${basePayload.name}" added to catalogue.`);
        }
        onClose();
      } catch {
        onError(
          isEditing ?
            "Failed to update menu item."
          : "Failed to add menu item.",
        );
      }
    });
  };

  const handleClose = () => {
    if (!isPending) onClose();
  };

  const categoryOptions = ITEM_CATEGORIES.map((c) => ({
    value: c,
    label: c.charAt(0).toUpperCase() + c.slice(1),
    icon: CATEGORY_ICONS_JSX[c],
  }));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={handleClose}
      />

      {/* Panel */}
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
          {isEditing ? "Edit Menu Item" : "Add Menu Item"}
        </h2>

        {/* Top-level form error */}
        {errors.root && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg mb-3 text-sm"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
          >
            <AlertCircle size={14} />
            {errors.root.message}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-2 gap-3"
        >
          {/* Name */}
          <div className="col-span-2">
            <Field label="Name" required error={errors.name?.message}>
              <input
                {...register("name")}
                placeholder="e.g. Chicken Biryani"
                style={inputStyle}
                disabled={isPending}
                autoFocus
              />
            </Field>
          </div>

          {/* Description */}
          <div className="col-span-2">
            <Field label="Description" error={errors.description?.message}>
              <input
                {...register("description")}
                placeholder="Short description"
                style={inputStyle}
                disabled={isPending}
              />
            </Field>
          </div>

          {/* Price */}
          <Field label="Price (Rs.)" required error={errors.price?.message}>
            <input
              {...register("price")}
              placeholder="e.g. 150"
              type="number"
              style={inputStyle}
              disabled={isPending}
            />
          </Field>

          {/* Category */}
          <Field label="Category" error={errors.category?.message}>
            <CustomSelect
              options={categoryOptions}
              value={watch("category")}
              onChange={(v) =>
                setValue("category", v as ItemCategory, { shouldDirty: true })
              }
              disabled={isPending}
            />
          </Field>

          {/* Calories */}
          <Field label="Calories" error={errors.calories?.message}>
            <input
              {...register("calories")}
              placeholder="kcal"
              type="number"
              style={inputStyle}
              disabled={isPending}
            />
          </Field>

          {/* Protein */}
          <Field label="Protein (g)" error={errors.proteinG?.message}>
            <input
              {...register("proteinG")}
              placeholder="0.0"
              style={inputStyle}
              disabled={isPending}
            />
          </Field>

          {/* Carbs */}
          <Field label="Carbs (g)" error={errors.carbsG?.message}>
            <input
              {...register("carbsG")}
              placeholder="0.0"
              style={inputStyle}
              disabled={isPending}
            />
          </Field>

          {/* Fat */}
          <Field label="Fat (g)" error={errors.fatG?.message}>
            <input
              {...register("fatG")}
              placeholder="0.0"
              style={inputStyle}
              disabled={isPending}
            />
          </Field>

          {/* Checkboxes */}
          <div className="col-span-2 flex items-center gap-6 mt-1">
            {(["isVegetarian", "isVegan"] as const).map((key) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  {...register(key)}
                  className="w-4 h-4"
                  disabled={isPending}
                />
                <span
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {key === "isVegetarian" ? "Vegetarian" : "Vegan"}
                </span>
              </label>
            ))}
          </div>

          {/* Actions */}
          <div className="col-span-2 flex gap-2 mt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-input)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: "var(--accent)",
                color: "var(--accent-text)",
              }}
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isPending ?
                isEditing ?
                  "Saving…"
                : "Adding…"
              : isEditing ?
                "Save Changes"
              : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
