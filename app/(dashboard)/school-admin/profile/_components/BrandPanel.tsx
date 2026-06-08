"use client";

import { CheckCircle } from "lucide-react";
import { inputCls, inputSty } from "./ProfileForms";

function isValidHex(v: string) { return /^#[0-9A-Fa-f]{6}$/.test(v); }
function hexToRgb(hex: string) {
    return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
}
function isLight(hex: string) {
    const { r, g, b } = hexToRgb(hex); return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function BrandPreview({ color, name, logoUrl }: { color: string; name: string; logoUrl: string }) {
    const c = isValidHex(color) ? color : "#000000";
    const textOnColor = isLight(c) ? "#000000" : "#ffffff";
    return (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-card)" }}>
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: c }}>
                {logoUrl ? (
                    <img src={logoUrl} alt="" className="w-5 h-5 rounded object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                    <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black"
                        style={{ background: `${textOnColor}20`, color: textOnColor }}>
                        {name?.[0] ?? "S"}
                    </div>
                )}
                <span className="text-xs font-bold truncate" style={{ color: textOnColor }}>
                    {name || "Your School"}
                </span>
            </div>
            <div className="p-3 space-y-2" style={{ background: "var(--bg-secondary)" }}>
                <div className="flex gap-2">
                    <div className="flex-1 h-2 rounded-full" style={{ background: "var(--border-primary)" }} />
                    <div className="w-1/3 h-2 rounded-full" style={{ background: "var(--border-primary)" }} />
                </div>
                <div className="flex gap-2 items-center">
                    <div className="px-3 py-1 rounded-lg text-[10px] font-bold"
                        style={{ background: c, color: textOnColor }}>Button</div>
                    <div className="px-3 py-1 rounded-lg text-[10px] font-medium border"
                        style={{ borderColor: c, color: c }}>Outline</div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-primary)" }}>
                    <div className="h-full w-2/3 rounded-full" style={{ background: c }} />
                </div>
            </div>
            <p className="px-3 py-2 text-[10px] text-center" style={{ color: "var(--text-muted)" }}>
                Brand preview — wires up in a future update
            </p>
        </div>
    );
}

const PALETTE = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#0ea5e9", "#64748b", "#000000"];

interface Props {
    primaryColor: string;
    name: string;
    logoUrl: string;
    onChange: (color: string) => void;
}

export function BrandPanel({ primaryColor, name, logoUrl, onChange }: Props) {
    const liveColor = isValidHex(primaryColor) ? primaryColor : "#3b82f6";
    return (
        <div className="rounded-2xl border overflow-hidden"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}>
            <div className="px-5 py-4 border-b"
                style={{ borderColor: "var(--border-primary)", background: "var(--bg-secondary)" }}>
                <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Brand Colour</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Used across the hero, badges, and buttons.</p>
            </div>
            <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                    <label htmlFor="color-picker"
                        className="relative w-14 h-10 rounded-xl border-2 overflow-hidden cursor-pointer shadow-inner transition-transform hover:scale-105"
                        style={{ borderColor: "var(--border-input)" }}>
                        <div className="absolute inset-0" style={{ background: liveColor }} />
                        <input id="color-picker" type="color" value={liveColor}
                            onChange={(e) => onChange(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                    </label>
                    <input value={primaryColor} onChange={(e) => onChange(e.target.value)}
                        placeholder="#3b82f6" maxLength={7}
                        className={`${inputCls} font-mono flex-1`} style={inputSty(liveColor)} />
                </div>

                <div>
                    <p className="text-[10px] font-semibold mb-2 uppercase tracking-widest"
                        style={{ color: "var(--text-muted)" }}>Quick palette</p>
                    <div className="flex flex-wrap gap-2">
                        {PALETTE.map((c) => (
                            <button key={c} type="button" onClick={() => onChange(c)}
                                className="w-6 h-6 rounded-lg border-2 transition-transform hover:scale-110 cursor-pointer"
                                style={{ background: c, borderColor: primaryColor === c ? "var(--text-primary)" : "transparent" }} />
                        ))}
                    </div>
                </div>

                <BrandPreview color={liveColor} name={name} logoUrl={logoUrl} />
            </div>
        </div>
    );
}