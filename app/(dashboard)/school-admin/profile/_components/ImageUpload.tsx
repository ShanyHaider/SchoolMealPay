"use client";

import { useRef, useState } from "react";
import { Camera, X, Upload } from "lucide-react";

interface Props {
    /** "avatar" = square with rounded corners, "banner" = wide 16:5 strip */
    variant: "avatar" | "banner";
    value: string;           // current URL (from DB or local object URL)
    onChange: (url: string) => void;
    accentColor?: string;
}

export function ImageUpload({ variant, value, onChange, accentColor = "#3b82f6" }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    function handleFile(file: File) {
        if (!file.type.startsWith("image/")) return;
        // TODO: swap this for your actual upload logic (e.g. uploadthing / S3 presigned URL)
        // For now uses a local object URL so the preview works immediately
        const url = URL.createObjectURL(file);
        onChange(url);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }

    const isAvatar = variant === "avatar";

    return (
        <div
            className={`relative overflow-hidden border-2 border-dashed transition-colors cursor-pointer group
                ${isAvatar ? "w-24 h-24 rounded-2xl" : "w-full h-28 rounded-xl"}`}
            style={{
                borderColor: dragging ? accentColor : "var(--border-input)",
                background: value ? "transparent" : "var(--bg-secondary)",
            }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
        >
            {/* Preview */}
            {value && (
                <img
                    src={value}
                    alt=""
                    className={`w-full h-full ${isAvatar ? "object-cover" : "object-cover"}`}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
            )}

            {/* Overlay on hover */}
            <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 transition-opacity"
                style={{
                    background: value ? "rgba(0,0,0,0.45)" : "transparent",
                    opacity: value ? 0 : 1,
                }}
            >
                {!value && (
                    <>
                        <Upload size={isAvatar ? 18 : 16} style={{ color: "var(--text-muted)" }} />
                        <p className="text-[10px] font-medium text-center px-2" style={{ color: "var(--text-muted)" }}>
                            {isAvatar ? "Upload logo" : "Upload banner"}
                        </p>
                    </>
                )}
            </div>

            {/* Hover overlay when image exists */}
            {value && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.5)" }}>
                    <Camera size={16} color="#fff" />
                    <span className="text-xs font-semibold text-white">Change</span>
                </div>
            )}

            {/* Clear button */}
            {value && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onChange(""); }}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center z-10"
                    style={{ background: "rgba(0,0,0,0.6)" }}
                >
                    <X size={10} color="#fff" />
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
        </div>
    );
}