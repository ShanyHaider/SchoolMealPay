"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { chatAboutNutrition } from "@/db/actions/ai/nutrition";
import type { NutritionTargets } from "@/db/actions/ai/nutrition";
import type { NutritionAverages } from "@/types/nutritionTypes";

interface Message { role: "user" | "assistant"; content: string; }

interface Props {
    userId: string;
    children: { name: string; avg: NutritionAverages }[];
    targets: NutritionTargets;
}

export function NutritionChat({ userId, children, targets }: Props) {
    const [selectedChild, setSelectedChild] = useState(children[0]?.name ?? "");
    const [history, setHistory] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isPending, startTransition] = useTransition();
    const [conversationId, setConversationId] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history, isPending]);

    function send() {
        const msg = input.trim();
        if (!msg || isPending) return;
        const child = children.find((c) => c.name === selectedChild);
        if (!child) return;

        setHistory(h => [...h, { role: "user", content: msg }]);
        setInput("");

        startTransition(async () => {
            const { reply, conversationId: newConvId } = await chatAboutNutrition(
                userId,
                child.name,
                child.avg,
                targets,
                conversationId,
                msg,
            );
            setConversationId(newConvId);
            setHistory(h => [...h, { role: "assistant", content: reply }]);
        });
    }

    return (
        <div className="bg-(--bg-card) border border-(--border-card) rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-(--border-card)">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-violet-500" />
                    <span className="font-bold text-(--text-primary)">Ask about nutrition</span>
                </div>
                {children.length > 1 && (
                    <select
                        value={selectedChild}
                        onChange={(e) => {
                            setSelectedChild(e.target.value);
                            setHistory([]);
                            setConversationId(null);
                        }}
                        className="text-sm bg-(--bg-tertiary) text-(--text-primary) border border-(--border-card) rounded-lg px-2 py-1"
                    >
                        {children.map((c) => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Messages */}
            <div className="flex flex-col gap-4 p-5 min-h-[200px] max-h-[380px] overflow-y-auto">
                {history.length === 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                        <p className="text-xs text-(--text-muted) font-medium">Suggested questions</p>
                        {[
                            `Is ${selectedChild} getting enough protein?`,
                            `What meals should ${selectedChild} avoid?`,
                            `How can I improve ${selectedChild}'s fiber intake?`,
                        ].map((q) => (
                            <button
                                key={q}
                                onClick={() => setInput(q)}
                                className="text-left text-sm px-3 py-2 bg-(--bg-tertiary) hover:bg-(--bg-secondary) rounded-xl text-(--text-secondary) transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {history.map((m, i) => (
                    <div key={i} className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.role === "assistant"
                            ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600"
                            : "bg-(--bg-tertiary) text-(--text-secondary)"
                            }`}>
                            {m.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
                        </div>
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user"
                            ? "bg-(--accent) text-(--accent-text) rounded-tr-sm"
                            : "bg-(--bg-tertiary) text-(--text-secondary) rounded-tl-sm"
                            }`}>
                            {m.content}
                        </div>
                    </div>
                ))}

                {isPending && (
                    <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center shrink-0">
                            <Bot size={14} />
                        </div>
                        <div className="px-4 py-3 bg-(--bg-tertiary) rounded-2xl rounded-tl-sm">
                            <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <span
                                        key={i}
                                        className="w-1.5 h-1.5 bg-(--text-muted) rounded-full animate-bounce"
                                        style={{ animationDelay: `${i * 0.15}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-(--border-card) flex gap-3">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={`Ask about ${selectedChild}'s nutrition…`}
                    className="flex-1 text-sm bg-(--bg-tertiary) text-(--text-primary) placeholder:text-(--text-muted) border border-(--border-card) rounded-xl px-4 py-2.5 outline-none focus:border-(--border-primary) transition-colors"
                />
                <button
                    onClick={send}
                    disabled={!input.trim() || isPending}
                    className="w-10 h-10 flex items-center justify-center bg-(--accent) text-(--accent-text) rounded-xl hover:bg-(--accent-hover) transition-colors disabled:opacity-40"
                >
                    <Send size={15} />
                </button>
            </div>
        </div>
    );
}