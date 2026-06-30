"use client";

import { useRef, useState } from "react";
import { Camera, X, Upload, Loader2 } from "lucide-react";
import Image from "next/image";

interface Props {
    variant: "avatar" | "banner";
    value: string;
    onChange: (url: string) => void;
    accentColor?: string;
}

export function ImageUpload({ variant, value, onChange, accentColor = "#3b82f6" }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    async function handleFile(file: File) {
        if (!file.type.startsWith("image/")) return;
        if (file.size > 4 * 1024 * 1024) return; // 4MB limit for banner, 2MB for avatar

        setUploading(true);
        // Show preview immediately
        const preview = URL.createObjectURL(file);
        onChange(preview);

        // Convert to base64 for DB storage
        const reader = new FileReader();
        reader.onloadend = () => {
            onChange(reader.result as string);
            setUploading(false);
        };
        reader.onerror = () => setUploading(false);
        reader.readAsDataURL(file);
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
            onClick={() => !uploading && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
        >
            {value && (
                <img
                    src={value}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
            )}

            {/* Empty state */}
            {/* Empty state — banner shows brand color, avatar shows neutral bg */}
            {!value && !uploading && (
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                    style={!isAvatar ? { background: `linear-gradient(135deg, ${accentColor}cc 0%, ${accentColor}66 60%, ${accentColor}22 100%)` } : undefined}
                >
                    <Upload size={isAvatar ? 18 : 16} style={{ color: isAvatar ? "var(--text-muted)" : "#ffffff99" }} />
                    <p className="text-[10px] font-medium text-center px-2"
                        style={{ color: isAvatar ? "var(--text-muted)" : "#ffffffbb" }}>
                        {isAvatar ? "Upload logo" : "Upload banner"}
                    </p>
                </div>
            )}

            {/* Hover overlay — now includes the clear button */}
            {value && !uploading && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.5)" }}>
                    <Camera size={16} color="#fff" />
                    <span className="text-xs font-semibold text-white">Change</span>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onChange(""); }}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center z-10"
                        style={{ background: "rgba(0,0,0,0.6)" }}
                    >
                        <X size={10} color="#fff" />
                    </button>
                </div>
            )}

            {/* Remove the old standalone clear button block entirely */}

            {/* Uploading overlay */}
            {uploading && (
                <div className="absolute inset-0 flex items-center justify-center gap-2"
                    style={{ background: "rgba(0,0,0,0.5)" }}>
                    <Loader2 size={16} className="animate-spin" color="#fff" />
                    <span className="text-xs font-semibold text-white">Processing…</span>
                </div>
            )}

            {/* Hover overlay when image exists */}
            {value && !uploading && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.5)" }}>
                    <Camera size={16} color="#fff" />
                    <span className="text-xs font-semibold text-white">Change</span>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onChange(""); }}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center z-10"
                        style={{ background: "rgba(0,0,0,0.6)" }}
                    >
                        <X size={10} color="#fff" />
                    </button>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
        </div>
    );
}