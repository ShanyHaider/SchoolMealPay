"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, Link, Pencil, User } from "lucide-react";

const inputCls =
    "w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--accent)] transition-shadow";

const isValidUrl = (str: string) => {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
};

interface AvatarUploaderProps {
    value: string;
    onChange: (value: string) => void;
    onError?: (msg: string) => void;
}

export function AvatarUploader({ value, onChange, onError }: AvatarUploaderProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const displaySrc = previewUrl || (value && isValidUrl(value) ? value : null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            onError?.("File matches or exceeds max allowed size of 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setPreviewUrl(result);
            onChange(result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        onChange("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPreviewUrl(null);
        onChange(e.target.value);
    };

    return (
        <div
            className="rounded-lg border p-3.5 flex flex-col gap-3"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border-input)" }}
        >
            {/* Avatar + action buttons row */}
            <div className="flex items-center gap-4">
                {/* Avatar circle */}
                <div className="relative shrink-0">
                    <div
                        className="h-14 w-14 rounded-full border overflow-hidden flex items-center justify-center"
                        style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}
                    >
                        {displaySrc ? (
                            <img src={displaySrc} alt="Avatar preview" className="h-full w-full object-cover" />
                        ) : (
                            <User size={22} style={{ color: "var(--text-muted)" }} />
                        )}
                    </div>
                    {/* Pencil badge */}
                    <div
                        className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border"
                        style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)" }}
                    >
                        <Pencil size={9} style={{ color: "var(--text-secondary)" }} />
                    </div>
                </div>

                {/* Buttons + hint */}
                <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="avatar-file-input"
                        />
                        <label
                            htmlFor="avatar-file-input"
                            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors hover:bg-[var(--bg-tertiary)]"
                            style={{ borderColor: "var(--border-input)", color: "var(--text-primary)", background: "var(--bg-card)" }}
                        >
                            <Upload size={12} />
                            Upload file
                        </label>

                        {(displaySrc || value) && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
                                style={{
                                    borderColor: "rgba(239,68,68,0.3)",
                                    color: "#ef4444",
                                    background: "rgba(239,68,68,0.08)",
                                }}
                            >
                                <Trash2 size={12} />
                                Remove
                            </button>
                        )}
                    </div>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        PNG or JPG, max 2 MB
                    </p>
                </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-px" style={{ background: "var(--border-primary)" }} />
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>or use a URL</span>
                <div className="flex-1 h-px" style={{ background: "var(--border-primary)" }} />
            </div>

            {/* URL input */}
            <div
                className="flex items-center gap-2 rounded-lg border px-2.5 py-2"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-input)" }}
            >
                <Link size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <input
                    type="text"
                    value={previewUrl ? "" : value}
                    onChange={handleUrlChange}
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1 bg-transparent text-xs outline-none font-mono"
                    style={{ color: "var(--text-primary)" }}
                />
            </div>
        </div>
    );
}