"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { PortalSelect } from "@/components/PortalSelect";
import { Field, Modal } from "./Ui";
import {
    addInventorySchema,
    editInventorySchema,
    inputStyle,
    UNITS,
    type AddInventoryValues,
    type EditInventoryValues,
    type InventoryItem,
    type UnitType,
} from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

type AddProps = {
    mode: "add";
    item?: never;
    isPending: boolean;
    onClose: () => void;
    onAdd: (data: AddInventoryValues) => void;
};

type EditProps = {
    mode: "edit";
    item: InventoryItem;
    isPending: boolean;
    onClose: () => void;
    onEdit: (data: EditInventoryValues) => void;
};

type InventoryItemModalProps = AddProps | EditProps;

// ─── Unit options ─────────────────────────────────────────────────────────────

const unitOptions = UNITS.map((u) => ({ value: u, label: u }));

// ─── Add modal ────────────────────────────────────────────────────────────────

function AddModal({ isPending, onClose, onAdd }: AddProps) {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<AddInventoryValues>({
        resolver: zodResolver(addInventorySchema),
        defaultValues: { name: "", unit: "kg", quantity: "", lowStockThreshold: "" },
    });

    const nameValue = watch("name");
    const quantityValue = watch("quantity");
    const isSubmitDisabled = isPending || !nameValue?.trim() || !quantityValue?.trim();

    return (
        <Modal title="Add Inventory Item" onClose={onClose}>
            <form onSubmit={handleSubmit(onAdd)} className="space-y-3">
                <Field label="Item Name" required error={errors.name?.message}>
                    <input {...register("name")} placeholder="e.g. Chicken" style={inputStyle} autoFocus />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Unit" required error={errors.unit?.message}>
                        <PortalSelect
                            options={unitOptions}
                            value={watch("unit")}
                            onChange={(v) =>
                                setValue("unit", (v ?? "kg") as UnitType, { shouldValidate: true })
                            }
                        />
                    </Field>
                    <Field label="Current Stock" required error={errors.quantity?.message}>
                        <input {...register("quantity")} type="number" placeholder="50" style={inputStyle} />
                    </Field>
                </div>

                <Field label="Reorder Level" error={errors.lowStockThreshold?.message}>
                    <input
                        {...register("lowStockThreshold")}
                        type="number"
                        placeholder="Alert when stock drops below this"
                        style={inputStyle}
                    />
                </Field>

                <div className="flex gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2 rounded-lg text-sm border"
                        style={{
                            borderColor: "var(--border-input)",
                            color: "var(--text-secondary)",
                            background: "var(--bg-tertiary)",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitDisabled}
                        className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: "var(--accent)", color: "var(--accent-text)" }}
                    >
                        {isPending && <Loader2 size={13} className="animate-spin" />}
                        {isPending ? "Adding…" : "Add Item"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

function EditModal({ item, isPending, onClose, onEdit }: EditProps) {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isDirty },
    } = useForm<EditInventoryValues>({
        resolver: zodResolver(editInventorySchema),
        defaultValues: {
            name: item.name,
            unit: item.unit as UnitType,
            quantity: item.quantity,
            lowStockThreshold: item.lowStockThreshold ?? "",
        },
    });

    const nameValue = watch("name");
    const quantityValue = watch("quantity");
    const isSubmitDisabled =
        isPending || !isDirty || !nameValue?.trim() || !quantityValue?.trim();

    return (
        <Modal title={`Edit — ${item.name}`} onClose={onClose}>
            <form onSubmit={handleSubmit(onEdit)} className="space-y-3">
                <Field label="Item Name" required error={errors.name?.message}>
                    <input {...register("name")} style={inputStyle} autoFocus />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Unit" required error={errors.unit?.message}>
                        <PortalSelect
                            options={unitOptions}
                            value={watch("unit")}
                            onChange={(v) =>
                                setValue("unit", (v ?? "kg") as UnitType, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                })
                            }
                        />
                    </Field>
                    <Field label="Current Stock" required error={errors.quantity?.message}>
                        <input {...register("quantity")} type="number" style={inputStyle} />
                    </Field>
                </div>

                <Field label="Reorder Level" error={errors.lowStockThreshold?.message}>
                    <input
                        {...register("lowStockThreshold")}
                        type="number"
                        placeholder="Leave empty to disable"
                        style={inputStyle}
                    />
                </Field>

                <div className="flex gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2 rounded-lg text-sm border"
                        style={{
                            borderColor: "var(--border-input)",
                            color: "var(--text-secondary)",
                            background: "var(--bg-tertiary)",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitDisabled}
                        className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: "var(--accent)", color: "var(--accent-text)" }}
                    >
                        {isPending && <Loader2 size={13} className="animate-spin" />}
                        {isPending ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function InventoryItemModal(props: InventoryItemModalProps) {
    if (props.mode === "add") return <AddModal {...props} />;
    return <EditModal {...props} />;
}